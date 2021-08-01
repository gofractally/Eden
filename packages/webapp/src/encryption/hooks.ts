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

    useEffect(() => {
        if (currentMember) {
            const publicKey = currentMember.encryption_key;
            const privateKey = publicKey
                ? getEncryptionKey(publicKey)
                : undefined;
            setEncryptionPassword({
                publicKey,
                privateKey,
            });
        } else {
            setEncryptionPassword({});
        }
    }, [currentMember]);

    const updateEncryptionPassword = (
        publicKey: string,
        privateKey: string
    ) => {
        putEncryptionKey(publicKey, privateKey);
        setEncryptionPassword({ publicKey, privateKey });
    };

    return {
        encryptionPassword,
        updateEncryptionPassword,
        isLoading,
        error,
    };
};
