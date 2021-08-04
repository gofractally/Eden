const ENCRYPTION_STORAGE_KEYS_KEY = "encryption_keys";

interface EncryptionKeysStorage {
    [publicKey: string]: string;
}

const getStoredKeys = (): EncryptionKeysStorage => {
    const keys = localStorage.getItem(ENCRYPTION_STORAGE_KEYS_KEY);
    return keys ? JSON.parse(keys) : {};
};

export const putEncryptionKey = (publicKey: string, privateKey: string) => {
    const keys = getStoredKeys();
    keys[publicKey] = privateKey;
    localStorage.setItem(ENCRYPTION_STORAGE_KEYS_KEY, JSON.stringify(keys));
};

export const getEncryptionKey = (publicKey: string): string | undefined => {
    return getStoredKeys()[publicKey];
};
