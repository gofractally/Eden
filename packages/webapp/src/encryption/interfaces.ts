export interface EncryptedKey {
    sender_key: string;
    recipient_key: string;
    key: Uint8Array;
}
