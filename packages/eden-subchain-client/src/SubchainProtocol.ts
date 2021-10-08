import { array } from "zod";

export interface BlockInfo {
    num: number;
    id: string;
}

export interface ClientStatus {
    maxBlocksToSend: number;
    irreversible: number;
    blocks: BlockInfo[];
}

export interface ServerMessage {
    type: string;
    head?: number;
    irreversible?: number;
}

export function sanitizeBlockInfo(src: any): BlockInfo {
    if (typeof src !== "object") src = {};
    return {
        num: src.num >>> 0,
        id: src.id + "",
    };
}

export function sanitizeClientStatus(src: any): ClientStatus {
    if (typeof src !== "object") src = {};
    return {
        maxBlocksToSend: Math.min(src.maxBlocksToSend >>> 0, 1000),
        irreversible: src.irreversible >>> 0,
        blocks: Array.isArray(src.blocks)
            ? src.blocks.map(sanitizeBlockInfo)
            : [],
    };
}

export function sanitizeServerMessage(src: any): ServerMessage {
    if (typeof src !== "object") src = {};
    return {
        type: src.type + "",
        head: src.head >>> 0,
        irreversible: src.irreversible >>> 0,
    };
}
