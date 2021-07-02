import CID from "cids";
import IpfsHash from "ipfs-only-hash";
import { create as ipfsHttpClient } from "ipfs-http-client";
import { IpfsUploadRequest } from "@edenos/common";

import { IpfsPostRequest } from "_api/schemas";
import { ipfsApiBaseUrl, box } from "config";

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
    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const fileHash = await IpfsHash.of(fileBytes);

    if (!box.enableIpfsUpload) {
        const uploadResponse = await IPFS_CLIENT.add(file, {
            progress: (p: any) =>
                console.log(`uploading to ipfs progress >>> ${p}`),
        });
        console.info("Uploaded File to IPFS Response:", uploadResponse);
        if (uploadResponse.path !== fileHash) {
            throw new Error("uploaded cid does not match the local hash");
        }
    }

    return fileHash;
};

export const uploadIpfsFileWithTransaction = async (
    signedTrx: any,
    cid: string,
    file: File
) => {
    const response = box.enableIpfsUpload
        ? await uploadTrxWithFileToBox(signedTrx, file)
        : await pinIpfsFileWithTransaction(signedTrx, cid);

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

const pinIpfsFileWithTransaction = (signedTrx: any, cid: string) => {
    const request: IpfsPostRequest = {
        cid,
        eosTransaction: {
            signatures: signedTrx.transaction.signatures,
            serializedTransaction: Array.from(
                signedTrx.transaction.serializedTransaction
            ),
        },
    };

    return fetch("/api/ipfs", {
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
    });
};

const uploadTrxWithFileToBox = (signedTrx: any, file: File) => {
    const data: IpfsUploadRequest = {
        syncUpload: true,
        eosTransaction: {
            signatures: signedTrx.transaction.signatures,
            serializedTransaction: Array.from(
                signedTrx.transaction.serializedTransaction
            ),
        },
    };

    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    formData.append("file", file, file.name);

    return fetch(`${box.address}/v1/ipfs-upload`, {
        method: "POST",
        body: formData,
    });
};
