export enum ActionType {
    SetEncryptionPassword = "SET_ENCRYPTION_PASSWORD",
    ShowPasswordModal = "SHOW_PASSWORD_MODAL",
    ShowUALSoftkeyModal = "SHOW_UAL_SOFTKEY_MODAL",
}

export const actionSetEncryptionPassword = (
    publicKey?: string,
    privateKey?: string
) => ({
    type: ActionType.SetEncryptionPassword,
    payload: { publicKey, privateKey },
});

/**
 * Intended for consumption by usePasswordModal hook. See hook for usage example.
 * @param {boolean} isOpen - controls open/close state of modal
 * @param {(success: boolean) => void} resolver - A promise resolver that is resolved when modal is dismissed
 * @param newPasswordIsInvalidForCurrentRound  - If set, a special message will appear to the user during password creation or reset warning them that their new password will not work for the current round
 * @returns a reducer action
 */
export const actionShowPasswordModal = (
    isOpen: boolean,
    resolver: ((success: boolean) => void) | null,
    newPasswordIsInvalidForCurrentRound: boolean = false
) => ({
    type: ActionType.ShowPasswordModal,
    payload: { isOpen, resolver, newPasswordIsInvalidForCurrentRound },
});

/**
 * Intended for consumption by UAL Softkey Authenticator.
 * @param {boolean} isOpen - controls open/close state of modal
 * @param {(value: unknown) => void} resolver - A promise resolver that is resolved when modal is dismissed
 * @returns a reducer action
 */
export const actionShowUALSoftkeyModal = (
    isOpen: boolean,
    resolver: ((value: string) => void) | null
) => ({
    type: ActionType.ShowUALSoftkeyModal,
    payload: { isOpen, resolver },
});
