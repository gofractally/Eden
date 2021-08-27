import { useContext, useEffect, useState } from "react";
import { Store, useCurrentMember } from "_app";
import { getEncryptionKey, putEncryptionKey } from "./storage";

export interface EncryptionPassword {
    publicKey?: string;
    privateKey?: string;
}

export type UpdateEncryptionPassword = (
    publicKey: string,
    privateKey: string
) => void;

// TODO: Move this to app hooks for use in useEncryptionPassword and other hooks
const useGlobalStore = () => {
    const globalStore = useContext(Store.store);
    if (!globalStore) throw new Error("hook should be within state provider");
    return globalStore;
};

export const useEncryptionPassword = () => {
    const globalStore = useContext(Store.store);
    if (!globalStore) throw new Error("hook should be within state provider");
    const { state, dispatch } = globalStore;

    const { data: currentMember, isLoading, error } = useCurrentMember();

    useEffect(() => {
        const { publicKey, privateKey } = getEncryptionPassword();
        const pubKeyChanged = state.encryptionPassword.publicKey !== publicKey;
        const privKeyChanged =
            state.encryptionPassword.privateKey !== privateKey;
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
        dispatch({
            type: "SET_ENCRYPTION_PASSWORD",
            payload: { publicKey, privateKey },
        });
    };

    const getEncryptionPassword = () => {
        if (!currentMember || !currentMember.encryption_key) return {};
        const publicKey = currentMember.encryption_key;
        const privateKey = getEncryptionKey(publicKey);
        return { publicKey, privateKey } as EncryptionPassword;
    };

    return {
        encryptionPassword: state.encryptionPassword,
        getEncryptionPassword,
        updateEncryptionPassword,
        isLoading: isLoading,
        error,
    };
};
