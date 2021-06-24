import { Request, Response } from "express";
import multer from "multer";
import * as z from "zod";
import * as eosjsJsonRpc from "eosjs/dist/eosjs-jsonrpc";
import * as eosjsApi from "eosjs/dist/eosjs-api";
import IpfsHash from "ipfs-only-hash";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

import { rpcEndpoint, edenContractAccount, ipfsConfig } from "../config";
import logger from "../logger";

export const eosTransaction = z.object({
    signatures: z.array(z.string()),
    serializedTransaction: z.array(z.number()),
});

export type EosTransaction = z.infer<typeof eosTransaction>;

interface ActionIpfsData {
    cid: string;
    contract: string;
    action: string;
}

export const trxUploadConfigHandler = multer({ dest: "tmp/" }).single("file");

export const trxUploadHandler = async (req: Request, res: Response) => {
    const { file, body } = req;
    // const file = {
    //     fieldname: "file",
    //     originalname: "image_2021-06-21_21-09-06.png",
    //     encoding: "7bit",
    //     mimetype: "image/png",
    //     destination: "tmp/",
    //     filename: "f5b5a3bf5abd1b57a0259bf7d42a7a20",
    //     path: "tmp/f5b5a3bf5abd1b57a0259bf7d42a7a20",
    //     size: 323232,
    // };

    if (!file) {
        return res.status(400).json({ error: "no file to upload" });
    }

    if (!body.data) {
        await fs.rm(file.path, () => {});
        return res.status(400).json({ error: "missing transaction data" });
    }

    const parsedTrx = eosTransaction.safeParse(JSON.parse(body.data));
    if (!parsedTrx.success) {
        await fs.rm(file.path, () => {});
        return res.status(400).json(parsedTrx.error);
    }

    const trx: EosTransaction = parsedTrx.data;

    try {
        const serializedTransaction = Uint8Array.from(
            trx.serializedTransaction
        );
        const actionIpfsData = await parseActionIpfsCid(serializedTransaction);
        await validateActionFile(actionIpfsData, file);

        const broadcastedTrx = await eosJsonRpc.send_transaction({
            signatures: trx.signatures,
            serializedTransaction,
        });

        // The consumer should not wait for the file to be completely
        // uploaded and pinned to IPFS
        uploadAndPinToIpfs(file);

        return res.json({ broadcastedTrx });
    } catch (e) {
        logger.error(e);
        await fs.rm(file.path, () => {});
        return res.status(500).json(e);
    }
};

const parseActionIpfsCid = async (
    serializedTransaction: Uint8Array
): Promise<ActionIpfsData> => {
    const trx = eosDefaultApi.deserializeTransaction(serializedTransaction);

    const serializedAction = trx.actions.find(
        (action: any) =>
            validUploadActions[action.account] &&
            validUploadActions[action.account][action.name]
    );

    if (!serializedAction) {
        throw new Error("contract action is not whitelisted for upload");
    }

    const actionData = (
        await eosDefaultApi.deserializeActions([serializedAction])
    )[0];

    const contract = serializedAction.account;
    const action = serializedAction.name;
    let cid = "";
    if (contract === edenContractAccount && action === "inductprofil") {
        cid = actionData.data.new_member_profile.img as string;
    } else if (contract === edenContractAccount && action === "inductvideo") {
        cid = actionData.data.video as string;
    } else {
        throw new Error("Unknown how to parse action");
    }

    return { cid, action, contract };
};

const validateActionFile = async (
    fileData: ActionIpfsData,
    file: Express.Multer.File
) => {
    const fileHash = await IpfsHash.of(fs.createReadStream(file.path));
    if (fileHash !== fileData.cid) {
        throw new Error(
            "uploaded file hash does not match the transaction cid"
        );
    }

    const validActionFile =
        validUploadActions[fileData.contract][fileData.action];
    if (file.size > validActionFile.maxSize) {
        throw new Error(
            `Uploaded File size exceeds the max size of ${Math.floor(
                validActionFile.maxSize / 1_000_000
            )} Mb`
        );
    }
};

/**
 * Upload and pin file to IPFS. If everything is successful it removes the
 * file from the temp folder.
 *
 * PS: Right now it's uploading and pinning with Pinata, but this would be
 * the place where we would upload to a local ipfs node
 */
const uploadAndPinToIpfs = async (file: Express.Multer.File) => {
    const data = new FormData();
    data.append("file", fs.createReadStream(file.path));

    console.info("uploading to pinata...");

    const uploadResult = await axios.post(ipfsConfig.pinataPinFileUrl, data, {
        maxBodyLength: Number.POSITIVE_INFINITY,
        headers: {
            "Content-Type": `multipart/form-data; boundary=${data.getBoundary()}`,
            Authorization: `Bearer ${ipfsConfig.pinataJwt}`,
        },
    });

    console.info("pinata upload result >>> ", uploadResult);

    await fs.rm(file.path, () => {});
};

const rpcEndpointUrl = `${rpcEndpoint.protocol}://${rpcEndpoint.host}:${rpcEndpoint.port}`;
console.info(rpcEndpointUrl);
export const eosJsonRpc = new eosjsJsonRpc.JsonRpc(rpcEndpointUrl, {
    fetch: require("node-fetch"),
});

export const eosDefaultApi = new eosjsApi.Api({
    rpc: eosJsonRpc,
    signatureProvider: {
        getAvailableKeys: async () => [],
        sign: async (args: any) => {
            throw new Error("implement");
        },
    },
});

interface ValidUploadActions {
    [contract: string]: {
        [action: string]: { maxSize: number };
    };
}

export const validUploadActions: ValidUploadActions = {
    [edenContractAccount]: {
        inductprofil: { maxSize: 1_000_000 },
        inductvideo: { maxSize: 100_000_000 },
    },
};
