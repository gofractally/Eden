import { blockExplorerAccountBaseUrl, ipfsBaseUrl } from "config";

export const ipfsUrl = (ipfsHash: string) => `${ipfsBaseUrl}/${ipfsHash}`;
export const explorerAccountUrl = (accountName: string) =>
    `${blockExplorerAccountBaseUrl}/${accountName}`;
