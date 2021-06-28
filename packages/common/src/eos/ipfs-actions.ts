import * as eosjsApi from "eosjs/dist/eosjs-api";
import fs from "fs";
import IpfsHash from "ipfs-only-hash";

export interface ValidUploadActions {
    [contract: string]: {
        [action: string]: { maxSize: number; cidField: string };
    };
}

export interface ActionIpfsData {
    cid: string;
    contract: string;
    action: string;
}

export const parseActionIpfsCid = async (
    serializedTransaction: Uint8Array,
    validUploadActions: ValidUploadActions,
    eosApi: eosjsApi.Api
): Promise<ActionIpfsData> => {
    const trx = eosApi.deserializeTransaction(serializedTransaction);

    const serializedAction = trx.actions.find(
        (action: any) =>
            validUploadActions[action.account] &&
            validUploadActions[action.account][action.name]
    );

    if (!serializedAction) {
        throw new Error("contract action is not whitelisted for upload");
    }

    const actionData = (await eosApi.deserializeActions([serializedAction]))[0];

    const contract = serializedAction.account;
    const action = serializedAction.name;
    const cid = extractCidFromActionData(
        contract,
        action,
        action.data,
        validUploadActions
    );
    return { cid, action, contract };
};

export const extractCidFromActionData = (
    contract: string,
    action: string,
    data: any,
    validUploadActions: ValidUploadActions
) => {
    const validContractActions = validUploadActions[contract];
    if (!validContractActions) {
        throw new Error(
            `contract ${contract} has no valid actions for extracting cid`
        );
    }

    const validAction = validContractActions[action];
    if (!validAction) {
        throw new Error(
            `${contract}::${action} is not a valid action for extracting cid`
        );
    }

    try {
        // Extract the CID supporting dot notation fields, eg: new_member_profile.img
        const cidFields = validAction.cidField.split(".");
        let cid = data;
        while (cidFields.length) {
            const cidField = cidFields.shift()!;
            cid = data[cidField];
        }
        return cid;
    } catch (e) {
        console.error("Unable to extract CID Field: ", e);
        throw new Error(`Unable to parse action ${contract}::${action}`);
    }
};

export const validateActionFile = async (
    fileData: ActionIpfsData,
    file: Express.Multer.File,
    validUploadActions: ValidUploadActions
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
