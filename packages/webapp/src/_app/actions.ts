export enum ActionType {
    SetEncryptionPassword = "SET_ENCRYPTION_PASSWORD",
}

export const actionSetEncryptionPassword = (
    publicKey?: string,
    privateKey?: string
) => ({
    type: ActionType.SetEncryptionPassword,
    payload: { publicKey, privateKey },
});
