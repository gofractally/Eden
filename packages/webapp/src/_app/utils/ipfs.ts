import CID from "cids";
import IpfsHash from "ipfs-only-hash";
import { create as ipfsHttpClient } from "ipfs-http-client";

import { IpfsPostRequest } from "_api/schemas";
import { ipfsApiBaseUrl } from "config";

export const validateCID = (str: string) => {
    try {
        new CID(str);
        return true;
    } catch {
        return false;
    }
};

const IPFS_CLIENT = ipfsHttpClient({ url: ipfsApiBaseUrl });
export const uploadToIpfs = async (file: File) => {
    // const uploadResponse = await IPFS_CLIENT.add(file, {
    //     progress: (p: any) => console.log(`uploading to ipfs progress: ${p}`),
    // });
    // console.log(uploadResponse);

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const fileHash = await IpfsHash.of(fileBytes);
    // if (uploadResponse.path !== fileHash) {
    //     throw new Error("uploaded cid does not match the local hash");
    // }
    return fileHash;
};

export const uploadIpfsFileWithTransaction = async (
    signedTrx: any,
    cid: string,
    file: File
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

    const formData = new FormData();
    formData.append("data", JSON.stringify(request.eosTransaction));
    formData.append("file", file, file.name);

    const response = await fetch("http://localhost:3032/v1/trx-upload", {
        method: "POST",
        body: formData,
    });

    // const response = await fetch("/api/ipfs", {
    //     method: "POST",
    //     headers: new Headers({
    //         "Content-Type": "application/json",
    //     }),
    //     body: JSON.stringify(request),
    // });

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

    // throw new Error("todo fix it!");
};
