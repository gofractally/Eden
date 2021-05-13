import type { NextApiRequest, NextApiResponse } from "next";
import IpfsHash from "ipfs-only-hash";
import FormData from "form-data";
import axios from "axios";

import { eosDefaultApi, eosJsonRpc } from "_app";
import { handleErrors } from "_api/error-handlers";
import { IpfsPostRequest, ipfsPostSchema } from "_api/schemas";
import { edenContractAccount, ipfsConfig } from "config";

export default (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case "POST":
            return ipfsUploadHandler(req, res);
        default:
            return handleErrors(res, ["request not supported"]);
    }
};

const VALID_UPLOAD_ACTIONS = [
    `${edenContractAccount}::inductprofil`,
    `${edenContractAccount}::inductvideo`,
];

const ipfsUploadHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    const result = ipfsPostSchema.safeParse(req.body);
    if (!result.success) {
        return handleErrors(res, result.error.flatten().formErrors);
    }

    const request: IpfsPostRequest = result.data;
    const signatures = request.eosTransaction.signatures;
    const serializedTransaction = Uint8Array.from(
        request.eosTransaction.serializedTransaction
    );

    const trx = eosDefaultApi.deserializeTransaction(serializedTransaction);
    console.info("deserialized trx", trx);
    const { actions } = trx;
    if (!actions || actions.length !== 1) {
        return handleErrors(res, ["only 1 action per upload"]);
    }

    const action = actions[0];
    const contractAction = `${action.account}::${action.name}`;
    if (VALID_UPLOAD_ACTIONS.indexOf(contractAction) < 0) {
        return handleErrors(res, ["action is not whitelisted for upload"]);
    }

    const actionIpfsCid = await parseActionIpfsCid(action);
    if (!actionIpfsCid) {
        return handleErrors(res, ["unable to parse action data ipfs cid"]);
    }

    console.info(actionIpfsCid);

    const fileBytes = Uint8Array.from(request.file);
    const uploadedFileHash = await IpfsHash.of(fileBytes);
    if (uploadedFileHash !== actionIpfsCid) {
        return handleErrors(res, [
            "uploaded file is different than stated in signed transaction",
        ]);
    }

    const broadcastedTrx = await eosJsonRpc.send_transaction({
        signatures,
        serializedTransaction,
    });
    const uploadedFile = await uploadToIpfs(uploadedFileHash, fileBytes);

    res.status(200).json({ broadcastedTrx, uploadedFile });
};

const parseActionIpfsCid = async (action: any): Promise<string | undefined> => {
    const actionData = (await eosDefaultApi.deserializeActions([action]))[0];
    if (
        actionData.account === edenContractAccount &&
        actionData.name === "inductprofil"
    ) {
        return actionData.data.new_member_profile.img as string;
    }
};

const uploadToIpfs = async (filename: string, file: Uint8Array) => {
    const formData = new FormData();
    formData.append("file", Buffer.from(file), { filename });

    const response = await axios.post(ipfsConfig.uploadEndpointUrl, formData, {
        maxBodyLength: Number.POSITIVE_INFINITY,
        headers: {
            "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`,
            Authorization: `Bearer ${ipfsConfig.pinataJwt}`,
        },
    });

    const responseData = response.data;
    return responseData;
};
