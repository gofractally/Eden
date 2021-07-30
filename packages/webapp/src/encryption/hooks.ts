import { useCurrentMember } from "_app";
import { getEncryptionKey } from "./storage";

export const useEncryptionPassword = () => {
    const { data: currentMember, isLoading, error } = useCurrentMember();

    let encryptionPassword = undefined;
    if (currentMember) {
        const publicKey = currentMember.encryption_key;
        const privateKey = publicKey ? getEncryptionKey(publicKey) : undefined;
        encryptionPassword = { publicKey, privateKey };
    }

    return {
        encryptionPassword,
        isLoading,
        error,
    };
};
