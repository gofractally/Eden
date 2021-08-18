export interface EncryptedKey {
    sender_key: string;
    recipient_key: string;
    key: Uint8Array;
}

export interface EncryptedData {
    id: string;
    keys: EncryptedKey[];
    data: Uint8Array;
}
