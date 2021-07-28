export interface BlockInfo {
    num: number;
    id: string;
}

export interface ClientStatus {
    maxBlocksToSend: number;
    blocks: BlockInfo[];
}

export interface ServerMessage {
    type: string;
    head?: number;
}
