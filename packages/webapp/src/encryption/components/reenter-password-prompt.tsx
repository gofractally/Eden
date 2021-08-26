import { useState } from "react";

import { delay, onError, queryMemberByAccountName, useUALAccount } from "_app";

import { setEncryptionPublicKeyTransaction } from "../transactions";
import { useEncryptionPassword } from "../hooks";
import NewPasswordForm from "./new-password-form";
import ReenterPasswordForm from "./reenter-password-form";
import PasswordSuccessConfirmation from "./password-success-confirmation";
import { useQueryClient } from "react-query";

interface Props {
    onCancel: () => void;
    onBeforeUpdatePassword?: () => void;
    onDismissConfirmation: () => void;
    encryptionPassword: ReturnType<typeof useEncryptionPassword>;
}

export const ReenterPasswordPrompt = ({
    onCancel,
    onBeforeUpdatePassword,
    onDismissConfirmation,
    encryptionPassword: encryptionPasswordResult,
}: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [ualAccount] = useUALAccount();
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const queryClient = useQueryClient();

    const {
        encryptionPassword,
        updateEncryptionPassword,
    } = encryptionPasswordResult;

    const onSubmit = (publicKey: string, privateKey: string) => {
        try {
            updateEncryptionPassword(publicKey, privateKey);
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            onError(error);
        }
    };

    const onSubmitForgotPassword = async (
        publicKey: string,
        privateKey: string
    ) => {
        try {
            setIsLoading(true);
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
            await delay(3000); // allow time for chain tables to update

            // invalidate current member query to make observing queries aware of presence of new password
            queryClient.invalidateQueries(
                queryMemberByAccountName(ualAccount.accountName).queryKey
            );
            onSubmit(publicKey, privateKey);
        } catch (error) {
            setIsLoading(false);
            console.error(error);
            onError(error);
        }
    };

    const handleOnDismiss = () => {
        setIsSuccess(false);
        onDismissConfirmation();
    };

    const handleOnCancel = () => {
        setForgotPasswordMode(false);
        setIsSuccess(false);
        onCancel();
    };

    if (isSuccess) {
        return <PasswordSuccessConfirmation onDismiss={handleOnDismiss} />;
    }

    if (forgotPasswordMode) {
        return (
            <NewPasswordForm
                isLoading={isLoading}
                onSubmit={(pub, priv) => {
                    onBeforeUpdatePassword?.();
                    return onSubmitForgotPassword(pub, priv);
                }}
                onCancel={handleOnCancel}
                forgotPassword={true}
            />
        );
    }

    return (
        <ReenterPasswordForm
            expectedPublicKey={encryptionPassword.publicKey!}
            onSubmit={(pub, priv) => {
                onBeforeUpdatePassword?.();
                onSubmit(pub, priv);
            }}
            onCancel={handleOnCancel}
            onForgotPassword={() => setForgotPasswordMode(true)}
        />
    );
};

export default ReenterPasswordPrompt;
