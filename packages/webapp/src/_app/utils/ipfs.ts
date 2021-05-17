import CID from "cids";

import { IpfsPostRequest } from "_api/schemas";

export const validateCID = (str: string) => {
    try {
        new CID(str);
        return true;
    } catch {
        return false;
    }
};

export const uploadIpfsFileWithTransaction = async (
    signedTrx: any,
    cid: string
) => {
    const request: IpfsPostRequest = {
        cid,
        eosTransaction: {
            signatures: signedTrx.transaction.signatures,
            serializedTransaction: Array.from(
                signedTrx.transaction.serializedTransaction
            ),
        },
    };

    const response = await fetch("/api/ipfs", {
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        console.error(response.status, response.statusText);
        const responseData = await response.json();
        console.error(responseData);
        throw new Error(
            `${
                responseData.error ||
                "Unknown error while submitting transaction and uploading file"
            }`
        );
    }
};
