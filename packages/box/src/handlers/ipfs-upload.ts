import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";
import {
    ipfsUploadRequest,
    IpfsUploadRequest,
    BadRequestError,
    handleErrors,
    parseActionIpfsCid,
    validateActionFile,
} from "@edenos/common";

import { ipfsConfig, validUploadActions } from "../config";
import { eosJsonRpc, eosDefaultApi } from "../eos";

export const ipfsUploadConfigHandler = multer({ dest: "tmp/" }).single("file");

export const ipfsUploadHandler = async (req: Request, res: Response) => {
    const { file, body } = req;
    try {
        if (!file) {
            throw new BadRequestError(["no file to upload"]);
        }

        if (!body.data) {
            throw new BadRequestError(["missing transaction data"]);
        }

        const parsedRequest = ipfsUploadRequest.safeParse(
            JSON.parse(body.data)
        );
        if (parsedRequest.success !== true) {
            throw new BadRequestError(parsedRequest.error.flatten());
        }

        const requestData: IpfsUploadRequest = parsedRequest.data;

        if (!requestData.syncUpload) {
            // TODO: We need to implement a background job mechanism to make sure
            // the file can be upload asynchronously without blocking the client.
            throw new BadRequestError(
                "Background upload jobs are not implemented yet for this Box"
            );
        }

        return await ipfsUpload(requestData, file, res);
    } catch (error) {
        if (file) {
            fs.rm(file.path, () => {});
        }
        return handleErrors(res, error);
    }
};

const ipfsUpload = async (
    requestData: IpfsUploadRequest,
    file: Express.Multer.File,
    res: Response
) => {
    const serializedTransaction = Uint8Array.from(
        requestData.eosTransaction.serializedTransaction
    );

    try {
        const actionIpfsData = await parseActionIpfsCid(
            serializedTransaction,
            validUploadActions,
            eosDefaultApi
        );
        await validateActionFile(actionIpfsData, file, validUploadActions);
    } catch (e) {
        throw new BadRequestError(e.message);
    }

    const broadcastedTrx = await eosJsonRpc.send_transaction({
        signatures: requestData.eosTransaction.signatures,
        serializedTransaction,
    });

    await uploadAndPinToIpfs(file, requestData.syncUpload);

    return res.json({ broadcastedTrx });
};

/**
 * Upload and pin file to IPFS. If everything is successful it removes the
 * file from the temp folder.
 *
 * PS: Right now it's uploading and pinning with Pinata, but this would be
 * the place where we would upload to a local ipfs node
 *
 * @param file is a Multer File, sample data:
 * {
 *   fieldname: "file",
 *   originalname: "image_2021-06-21_21-09-06.png",
 *   encoding: "7bit",
 *   mimetype: "image/png",
 *   destination: "tmp/",
 *   filename: "f5b5a3bf5abd1b57a0259bf7d42a7a20",
 *   path: "tmp/f5b5a3bf5abd1b57a0259bf7d42a7a20",
 *   size: 323232,
 * };
 *
 * @param syncUpload is a flag to indicate that we should wait for the
 * pinning service to complete. If false we can trigger a job and make
 * sure the pinning was completed in the background without holding
 * the uploader client.
 */
const uploadAndPinToIpfs = async (
    file: Express.Multer.File,
    syncUpload: boolean
) => {
    const data = new FormData();
    data.append("file", fs.createReadStream(file.path));

    console.info("uploading to pinata...");

    const headers = {
        maxBodyLength: Number.POSITIVE_INFINITY,
        headers: {
            "Content-Type": `multipart/form-data; boundary=${data.getBoundary()}`,
            Authorization: `Bearer ${ipfsConfig.pinataJwt}`,
        },
    };

    const uploadResult = await axios.post(
        ipfsConfig.pinataPinFileUrl,
        data,
        headers
    );

    console.info(
        "pinata upload result >>> ",
        uploadResult.status,
        uploadResult.data
    );

    await fs.rm(file.path, () => {});
};
