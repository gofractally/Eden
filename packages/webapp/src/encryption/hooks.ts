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
    const [isInitialized, setIsInitialized] = useState(false);
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
            setIsInitialized(true);
        } else if (Object.keys(encryptionPassword).length) {
            // We needlessly update state causing extra hook updates if we set the password to {} when it's already {}.
            // This prevents extra hook updates/renders and helps prevent the banner from flickering when loading.
            setEncryptionPassword({});
            setIsInitialized(true);
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
        isLoading: isLoading || !isInitialized, // prevent flicker
        error,
    };
};
