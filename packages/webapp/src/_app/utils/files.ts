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
        throw new Error(await response.text());
    }
};
