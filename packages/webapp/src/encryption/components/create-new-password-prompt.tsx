import { useState } from "react";

import { onError, useUALAccount } from "_app";

import NewPasswordForm from "./new-password-form";
import PasswordSuccessConfirmation from "./password-success-confirmation";
import { UpdateEncryptionPassword, useEncryptionPassword } from "../hooks";
import { setEncryptionPublicKeyTransaction } from "../transactions";

interface Props {
    onCancel: () => void;
    onDismissConfirmation: () => void;
}

export const CreateNewPasswordPrompt = ({
    onCancel,
    onDismissConfirmation,
}: Props) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [ualAccount] = useUALAccount();
    const { updateEncryptionPassword } = useEncryptionPassword();

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
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            onError(error);
        }

        setIsLoading(false);
    };

    const handleOnDismiss = () => {
        setIsSuccess(false);
        onDismissConfirmation();
    };

    const handleOnCancel = () => {
        setIsSuccess(false);
        onCancel();
    };

    if (isSuccess) {
        return <PasswordSuccessConfirmation onDismiss={handleOnDismiss} />;
    }

    return (
        <NewPasswordForm
            isLoading={isLoading}
            onSubmit={onSubmit}
            onCancel={handleOnCancel}
        />
    );
};

export default CreateNewPasswordPrompt;
