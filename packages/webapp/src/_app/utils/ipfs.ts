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

const fetchWithTimeout = async (
    url: string,
    options?: RequestInit & { timeout?: number }
) => {
    const { timeout = 8000 } = options || {};

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
        ...options,
        signal: controller.signal,
    });
    clearTimeout(id);

    return response;
};

// const IPFS_CLIENT = ipfsHttpClient({ url: ipfsApiBaseUrl });
import IpfsCore from "ipfs-core";
// const IPFS = require("ipfs-core");
let node: IpfsCore.IPFS | undefined = undefined;
if (typeof window !== "undefined" && !node) {
    IpfsCore.create().then(async (n) => {
        node = n;
    });
}

export const uploadToIpfs = async (file: File) => {
    if (!node) {
        throw new Error("Local IPFS Node is not started");
    }
    // const uploadResponse = await IPFS_CLIENT.add(file, {
    //     progress: (p: any) => console.log(`uploading to ipfs progress: ${p}`),
    // });
    // console.log(uploadResponse);
    const { cid } = await node.add(file, {
        progress: (p: any) => {
            console.info("adding file progress", p);
        },
    });

    for (let retries = 1; 0 <= 9; retries++) {
        await new Promise((resolve) =>
            setTimeout(resolve, (1 + retries) * 1000)
        );

        try {
            const uploadedFile = await fetchWithTimeout(
                `https://gateway.ipfs.io/ipfs/${cid.toString()}`
            );
            if (uploadedFile.ok) {
                break;
            }
        } catch (e) {
            console.info("ipfs upload request failed", e);
        }

        if (retries === 9) {
            throw new Error("fail to upload file to IPFS nodes");
        }
    }

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const fileHash = await IpfsHash.of(fileBytes);

    console.info(cid.toString(), node.id(), fileHash);
    // if (uploadResponse.path !== fileHash) {
    if (cid.toString() !== fileHash) {
        throw new Error("uploaded cid does not match the local hash");
    }
    return fileHash;
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
