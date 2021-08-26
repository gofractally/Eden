import { useEffect, useState } from "react";
import { useCurrentMember } from "_app";
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
    const [
        encryptionPassword,
        setEncryptionPassword,
    ] = useState<EncryptionPassword>({});
    const { data: currentMember, isLoading, error } = useCurrentMember();

    // This ensures that encryptionPassword is as up-to-date as the latest render
    // TODO: It would be much better to store encryptionPassword in a context reducer.
    useEffect(() => {
        const pw = getEncryptionPassword();
        const pubKeyChanged = pw.publicKey !== encryptionPassword.publicKey;
        const privKeyChanged = pw.privateKey !== encryptionPassword.privateKey;
        if (pubKeyChanged || privKeyChanged) setEncryptionPassword(pw);
    });

    const updateEncryptionPassword = (
        publicKey: string,
        privateKey: string
    ) => {
        putEncryptionKey(publicKey, privateKey);
        setEncryptionPassword({ publicKey, privateKey });
    };

    const getEncryptionPassword = () => {
        if (!currentMember || !currentMember.encryption_key) return {};
        const publicKey = currentMember.encryption_key;
        const privateKey = getEncryptionKey(publicKey);
        return { publicKey, privateKey } as EncryptionPassword;
    };

    return {
        encryptionPassword,
        getEncryptionPassword,
        updateEncryptionPassword,
        isLoading: isLoading,
        error,
    };
};
