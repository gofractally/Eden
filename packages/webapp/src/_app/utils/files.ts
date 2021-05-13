import { IpfsPostRequest } from "_api/schemas";

export const getFileBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

export const uploadIpfsFileWithTransaction = async (
    signedTrx: any,
    fileContent: Uint8Array
) => {
    const request: IpfsPostRequest = {
        file: Array.from(fileContent),
        eosTransaction: {
            signatures: signedTrx.transaction.signatures,
            serializedTransaction: Array.from(
                signedTrx.transaction.serializedTransaction
            ),
        },
    };

    await fetch("/api/ipfs", {
        method: "POST",
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify(request),
    });

    throw new Error("pls wait");
};
