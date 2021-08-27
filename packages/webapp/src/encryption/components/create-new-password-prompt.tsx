import { useState } from "react";

import { onError, useUALAccount } from "_app";

import { setEncryptionPublicKeyTransaction } from "../transactions";
import { UpdateEncryptionPassword } from "../hooks";
import NewPasswordForm from "./new-password-form";
import PasswordSuccessConfirmation from "./password-success-confirmation";

interface Props {
    onCancel: () => void;
    onBeforeUpdatePassword?: () => void;
    onDismissConfirmation: () => void;
    updateEncryptionPassword: UpdateEncryptionPassword;
    isTooLateForCurrentRound?: boolean;
}

export const CreateNewPasswordPrompt = ({
    onCancel,
    onBeforeUpdatePassword,
    onDismissConfirmation,
    updateEncryptionPassword,
    isTooLateForCurrentRound,
}: Props) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [ualAccount] = useUALAccount();

    const onSubmit = async (publicKey: string, privateKey: string) => {
        onBeforeUpdatePassword?.();
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
            isTooLateForCurrentRound={isTooLateForCurrentRound}
        />
    );
};

export default CreateNewPasswordPrompt;
