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
