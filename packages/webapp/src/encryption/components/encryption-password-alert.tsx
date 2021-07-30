import { Text } from "_app";

import { useEncryptionPassword } from "../hooks";

interface Props {
    promptSetupEncryptionKey?: boolean;
}

export const EncryptionPasswordAlert = ({
    promptSetupEncryptionKey,
}: Props) => {
    const { encryptionPassword, isLoading, error } = useEncryptionPassword();

    if (isLoading) {
        return <Text type="note">Loading Encryption Keys...</Text>;
    } else if (error || !encryptionPassword) {
        return <Text type="note">Encryption Keys could not be loaded</Text>;
    }

    if (promptSetupEncryptionKey && !encryptionPassword.publicKey) {
        return <Text>Setup your encryption key now: click here!</Text>;
    }

    if (encryptionPassword.publicKey && !encryptionPassword.privateKey) {
        return (
            <Text>
                Warning! Your encryption key is not present... Confirm your
                password now: click here!
            </Text>
        );
    }

    return null;
};
