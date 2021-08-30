import { useState } from "react";
import { useQueryClient } from "react-query";

import { delay, onError, queryMemberByAccountName, useUALAccount } from "_app";

import { setEncryptionPublicKeyTransaction } from "../transactions";
import NewPasswordForm from "./new-password-form";
import ReenterPasswordForm from "./reenter-password-form";
import PasswordSuccessConfirmation from "./password-success-confirmation";
import { useEncryptionPassword } from "../hooks";

interface Props {
    onCancel: () => void;
    onDismissConfirmation: () => void;
    isTooLateForCurrentRound?: boolean;
}

export const ReenterPasswordPrompt = ({
    onCancel,
    onDismissConfirmation,
    isTooLateForCurrentRound,
}: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [ualAccount] = useUALAccount();
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const queryClient = useQueryClient();
    const {
        encryptionPassword,
        updateEncryptionPassword,
    } = useEncryptionPassword();

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

    const handleOnDismiss = async () => {
        onDismissConfirmation();
        await delay(300); // wait for modal to dismiss before resetting state
        setIsSuccess(false);
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
                onSubmit={onSubmitForgotPassword}
                onCancel={handleOnCancel}
                forgotPassword={true}
                isTooLateForCurrentRound={isTooLateForCurrentRound}
            />
        );
    }

    return (
        <ReenterPasswordForm
            expectedPublicKey={encryptionPassword.publicKey!}
            onSubmit={onSubmit}
            onCancel={handleOnCancel}
            onForgotPassword={() => setForgotPasswordMode(true)}
        />
    );
};

export default ReenterPasswordPrompt;
