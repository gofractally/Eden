import { useEffect } from "react";

import {
    actionSetEncryptionPassword,
    useCurrentMember,
    useGlobalStore,
} from "_app";

import { getEncryptionKey, putEncryptionKey } from "./storage";

export interface EncryptionPassword {
    publicKey?: string;
    privateKey?: string;
}

export type UpdateEncryptionPassword = (
    publicKey: string,
    privateKey: string
) => void;

export const useEncryptionPassword = () => {
    const { state, dispatch } = useGlobalStore();
    const { data: currentMember, isLoading, error } = useCurrentMember();

    const { encryptionPassword } = state;

    useEffect(() => {
        const { publicKey, privateKey } = getEncryptionPassword();
        const pubKeyChanged = encryptionPassword.publicKey !== publicKey;
        const privKeyChanged = encryptionPassword.privateKey !== privateKey;
        if (pubKeyChanged || privKeyChanged)
            setEncryptionPassword(publicKey, privateKey);
    });

    const updateEncryptionPassword = (
        publicKey: string,
        privateKey: string
    ) => {
        putEncryptionKey(publicKey, privateKey);
        setEncryptionPassword(publicKey, privateKey);
    };

    const setEncryptionPassword = (publicKey?: string, privateKey?: string) => {
        dispatch(actionSetEncryptionPassword(publicKey, privateKey));
    };

    const getEncryptionPassword = () => {
        if (!currentMember || !currentMember.encryption_key) return {};
        const publicKey = currentMember.encryption_key;
        const privateKey = getEncryptionKey(publicKey);
        return { publicKey, privateKey } as EncryptionPassword;
    };

    const { publicKey, privateKey } = encryptionPassword;
    const isPasswordNotSet = isLoading ? undefined : !publicKey;
    const isPasswordSetNotPresent = isLoading
        ? undefined
        : Boolean(publicKey && !privateKey);

    return {
        encryptionPassword,
        updateEncryptionPassword,
        isLoading,
        isPasswordNotSet,
        isPasswordSetNotPresent,
        error,
    };
};
