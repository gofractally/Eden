import { useState } from "react";

import { onError, useUALAccount } from "_app";

import { setEncryptionPublicKeyTransaction } from "../transactions";
import { UpdateEncryptionPassword } from "../hooks";
import NewPasswordForm from "./new-password-form";
import PasswordSuccessConfirmation from "./password-success-confirmation";

interface Props {
    isSuccess: boolean;
    close: () => void;
    updateEncryptionPassword: UpdateEncryptionPassword;
}

export const CreateNewPasswordPrompt = ({
    isSuccess,
    close,
    updateEncryptionPassword,
}: Props) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [ualAccount] = useUALAccount();

    const onSubmit = async (publicKey: string, privateKey: string) => {
        setIsLoading(true);

        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = setEncryptionPublicKeyTransaction(
                authorizerAccount,
                publicKey
            );
            console.info("signing trx", transaction);

            const signedTrx = await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });
            console.info("set encryption public key trx", signedTrx);

            updateEncryptionPassword(publicKey, privateKey);
        } catch (error) {
            console.error(error);
            onError(error);
        }

        setIsLoading(false);
    };

    if (isSuccess) {
        return <PasswordSuccessConfirmation onDismiss={close} />;
    }

    return (
        <NewPasswordForm
            isLoading={isLoading}
            onSubmit={onSubmit}
            onCancel={close}
        />
    );
};

export default CreateNewPasswordPrompt;
