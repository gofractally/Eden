import type { NextApiRequest, NextApiResponse } from "next";

import { eosDefaultApi, eosJsonRpc } from "_app";
import { handleErrors } from "_api/error-handlers";
import { IpfsPostRequest, ipfsPostSchema } from "_api/schemas";
import { edenContractAccount, ipfsConfig } from "config";

const VALID_UPLOAD_ACTIONS = [
    `${edenContractAccount}::inductprofil`,
    `${edenContractAccount}::inductvideo`,
];

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case "POST":
            return ipfsUploadHandler(req, res);
        default:
            return handleErrors(res, ["request not supported"]);
    }
};

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

    if (request.cid !== actionIpfsCid) {
        return handleErrors(res, [
            "uploaded file is different than stated in signed transaction",
        ]);
    }

    const broadcastedTrx = await eosJsonRpc.send_transaction({
        signatures,
        serializedTransaction,
    });

    const pinResults = await pinIpfsCid(request.cid);

    res.status(200).json({ broadcastedTrx, pinResults });
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

const pinIpfsCid = async (cid: string) => {
    console.info(`pinning ${cid}...`);
    const body = { cid, name: cid };
    const pinResponse = await fetch(`${ipfsConfig.pinataApi}/pins`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${ipfsConfig.pinataJwt}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    const pinResults = await pinResponse.json();
    console.info(`pin file requested successfully!`, pinResults);
    return pinResults;
};
