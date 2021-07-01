import { ActionIpfsData, parseActionIpfsCid } from "@edenos/common";
import { BadRequestError, handleErrors } from "@edenos/common";

import { eosDefaultApi, eosJsonRpc } from "_app";
import {
    edenContractAccount,
    ipfsApiBaseUrl,
    ipfsConfig,
    validUploadActions,
} from "config";

import { IpfsPostRequest } from "../schemas";

export const ipfsUploadHandler = async (request: IpfsPostRequest) => {
    const signatures = request.eosTransaction.signatures;
    const serializedTransaction = Uint8Array.from(
        request.eosTransaction.serializedTransaction
    );

    const actionIpfsData = await parseActionIpfsCid(
        serializedTransaction,
        validUploadActions,
        eosDefaultApi
    );

    if (request.cid !== actionIpfsData.cid) {
        throw new BadRequestError(
            "uploaded file is different than stated in signed transaction"
        );
    }

    await validateActionFileFromIpfs(actionIpfsData);

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

const validateActionFileFromIpfs = async (fileData: ActionIpfsData) => {
    const validActionFile =
        validUploadActions[fileData.contract][fileData.action];
    const fileStats = await getIpfsFileStats(fileData.cid);
    if (fileStats.CumulativeSize > validActionFile.maxSize) {
        throw new Error(
            `Uploaded File size exceeds the max size of ${Math.floor(
                validActionFile.maxSize / 1_000_000
            )} Mb`
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
