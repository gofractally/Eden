import { blockExplorerAccountBaseUrl, ipfsBaseUrl } from "config";

export enum URL_KEY {
    HOME = "HOME",
    MEMBERS = "MEMBERS",
    INDUCTION = "INDUCTION",
    REPRESENTATION = "REPRESENTATION",
    TREASURY = "TREASURY",
    ELECTION = "ELECTION",
}
interface UrlPath {
    readonly [URL_KEY: string]: {
        href: string;
        label: string;
        opts?: any;
    };
}

export const URL_PATHS: UrlPath = {
    HOME: { href: "/", label: "Home" },
    MEMBERS: { href: "/members", label: "Community" },
    INDUCTION: { href: "/induction", label: "Membership" },
    REPRESENTATION: { href: "/representation", label: "Representation" },
    TREASURY: { href: "/treasury", label: "Treasury" },
    ELECTION: { href: "/election", label: "Election" },
};

export const ipfsUrl = (ipfsHash: string) => `${ipfsBaseUrl}/${ipfsHash}`;
export const explorerAccountUrl = (accountName: string) =>
    `${blockExplorerAccountBaseUrl}/${accountName}`;
