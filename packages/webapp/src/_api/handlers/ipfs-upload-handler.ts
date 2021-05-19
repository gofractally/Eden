import { eosDefaultApi, eosJsonRpc } from "_app";
import { edenContractAccount, ipfsApiBaseUrl, ipfsConfig } from "config";

import { BadRequestError, InternalServerError } from "../error-handlers";
import { IpfsPostRequest } from "../schemas";

interface ActionIpfsData {
    cid: string;
    contract: string;
    action: string;
}

interface ValidUploadActions {
    [contract: string]: {
        [action: string]: { maxSize: number };
    };
}

const VALID_UPLOAD_ACTIONS: ValidUploadActions = {
    [edenContractAccount]: {
        inductprofil: { maxSize: 1_000_000 },
        inductvideo: { maxSize: 100_000_000 },
    },
};

export const ipfsUploadHandler = async (request: IpfsPostRequest) => {
    const signatures = request.eosTransaction.signatures;
    const serializedTransaction = Uint8Array.from(
        request.eosTransaction.serializedTransaction
    );

    const actionIpfsData = await parseActionIpfsCid(serializedTransaction);

    if (request.cid !== actionIpfsData.cid) {
        throw new BadRequestError(
            "uploaded file is different than stated in signed transaction"
        );
    }

    await validateActionFile(actionIpfsData);

    try {
        const broadcastedTrx = await eosJsonRpc.send_transaction({
            signatures,
            serializedTransaction,
        });

        const pinResults = await pinIpfsCid(request.cid);

        return { broadcastedTrx, pinResults };
    } catch (error) {
        console.error(error);
        throw new InternalServerError(
            `Fail to broadcast or pin file: ${error.message}`
        );
    }
};

const parseActionIpfsCid = async (
    serializedTransaction: Uint8Array
): Promise<ActionIpfsData> => {
    const trx = eosDefaultApi.deserializeTransaction(serializedTransaction);
    const { actions } = trx;
    if (!actions || actions.length !== 1) {
        // TODO: we might support multiple actions files/uploads in the future
        throw new BadRequestError(["only 1 action per upload"]);
    }

    const serializedAction = actions[0];
    if (
        !VALID_UPLOAD_ACTIONS[serializedAction.account] ||
        !VALID_UPLOAD_ACTIONS[serializedAction.account][serializedAction.name]
    ) {
        throw new BadRequestError([
            "contract action is not whitelisted for upload",
        ]);
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
        throw new InternalServerError("Unknown how to parse action");
    }

    return { cid, action, contract };
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

    if (pinResults.error && pinResults.error.reason === "DUPLICATE_OBJECT") {
        return "DUPLICATE_OBJECT";
    }

    if (!pinResults.requestid) {
        throw new InternalServerError(
            "File was not able to proper request a pin"
        );
    }

    await confirmIpfsPin(pinResults.requestid);

    return pinResults;
};

const IPFS_CONFIRMATION_RETRIES = 5;
const confirmIpfsPin = async (requestId: string) => {
    for (let retries = 1; retries <= IPFS_CONFIRMATION_RETRIES; retries++) {
        await new Promise((resolve) =>
            setTimeout(resolve, (1 + retries) * 1000)
        );

        const pinStatusResponse = await fetch(
            `${ipfsConfig.pinataApi}/pins/${requestId}`,
            {
                headers: {
                    Authorization: `Bearer ${ipfsConfig.pinataJwt}`,
                },
            }
        );
        const pinStatus = await pinStatusResponse.json();
        console.info(`pin status >>> ${pinStatus.status}...`);

        if (pinStatus.status === "pinned") {
            break;
        }

        if (
            pinStatus.status === "failed" ||
            retries === IPFS_CONFIRMATION_RETRIES
        ) {
            throw new InternalServerError("Fail to pin uploaded file to IPFS");
        }
    }
};

const validateActionFile = async (fileData: ActionIpfsData) => {
    const validActionFile =
        VALID_UPLOAD_ACTIONS[fileData.contract][fileData.action];
    const fileStats = await getIpfsFileStats(fileData.cid);
    if (fileStats.CumulativeSize > validActionFile.maxSize) {
        throw new Error(
            `Uploaded File size exceeds the max size of ${Math.floor(
                validActionFile.maxSize / 1_000_000
            )} Mbs`
        );
    }
};

const getIpfsFileStats = async (cid: string) => {
    try {
        const fileStatsResponse = await fetch(
            `${ipfsApiBaseUrl}/object/stat?arg=${cid}`
        );
        return fileStatsResponse.json();
    } catch (error) {
        throw new InternalServerError(
            "Can't retrieve file stats: " + error.message
        );
    }
};
