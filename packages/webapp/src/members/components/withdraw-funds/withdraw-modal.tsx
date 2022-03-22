import React, { useState } from "react";
import { useQueryClient } from "react-query";

import { useFormFields, useUALAccount } from "_app";
import { Asset, assetFromNumber, onError } from "_app/utils";
import { queryTokenBalanceForAccount } from "_app/hooks/queries";
import { LoadingContainer, Modal } from "_app/ui";
import { DistributionAccount } from "delegates/interfaces";

import {
    WithdrawModalStepConfirmation,
    WithdrawModalStepFailure,
    WithdrawModalStepForm,
    WithdrawModalStepSuccess,
} from ".";
import { withdrawAndTransfer } from "../../transactions";

export enum WithdrawStep {
    Form,
    Confirmation,
    Success,
    Error,
}

export interface WithdrawFundsFormFields {
    to: string;
    amount: number;
    memo: string;
}

interface Props {
    isOpen: boolean;
    close: () => void;
    availableFunds?: Asset;
    distributions?: DistributionAccount[];
}

export const WithdrawModal = ({
    isOpen,
    close,
    availableFunds,
    distributions,
}: Props) => {
    const queryClient = useQueryClient();
    const [ualAccount] = useUALAccount();

    const [step, setStep] = useState<WithdrawStep>(WithdrawStep.Form);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [transactionId, setTransactionId] = useState<string>("");
    const [transactionError, setTransactionError] = useState<string>("");

    const formState = useFormFields<WithdrawFundsFormFields>({
        to: ualAccount?.accountName,
        amount: 0,
        memo: "",
    });

    const resetForm = () => {
        formState[1]();
    };

    const dismissModal = () => {
        close();
        resetForm();
        setStep(WithdrawStep.Form);
    };

    const onPreview = async (e: React.FormEvent) => {
        e.preventDefault();
        setStep(WithdrawStep.Confirmation);
    };

    const submitWithdraw = async () => {
        const { amount, to, memo } = formState[0];
        setIsLoading(true);

        try {
            const authorizerAccount = ualAccount.accountName;
            const trx = withdrawAndTransfer(
                authorizerAccount,
                assetFromNumber(amount),
                to,
                memo,
                distributions
            );
            console.info("signing trx", trx);

            const signedTrx = await ualAccount.signTransaction(trx, {
                broadcast: true,
            });
            console.info("withdraw available funds trx", signedTrx);

            // allow time for chain tables to update
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // invalidate member's queried blockchain account balance to reflect new balance
            queryClient.invalidateQueries(
                queryTokenBalanceForAccount(ualAccount.accountName).queryKey
            );
            setTransactionId(signedTrx.transactionId);
            setStep(WithdrawStep.Success);
        } catch (error) {
            console.error(error);
            onError(error as Error);
            setTransactionError((error as Error).toString());
            setStep(WithdrawStep.Error);
        }

        setIsLoading(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={dismissModal}
            contentLabel="Withdraw funds from Eden"
            preventScroll
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
        >
            {!ualAccount?.accountName ? (
                <LoadingContainer />
            ) : step === WithdrawStep.Form ? (
                <WithdrawModalStepForm
                    availableFunds={availableFunds}
                    onPreview={onPreview}
                    formState={formState}
                    onCancel={dismissModal}
                />
            ) : step === WithdrawStep.Confirmation ? (
                <WithdrawModalStepConfirmation
                    formValues={formState[0]}
                    goBack={() => setStep(WithdrawStep.Form)}
                    onConfirm={submitWithdraw}
                    isLoading={isLoading}
                />
            ) : step === WithdrawStep.Success ? (
                <WithdrawModalStepSuccess
                    isThirdPartyTransfer={
                        ualAccount.accountName !== formState[0].to
                    }
                    dismiss={dismissModal}
                    transactionId={transactionId}
                />
            ) : (
                <WithdrawModalStepFailure
                    dismiss={dismissModal}
                    tryAgain={() => setStep(WithdrawStep.Confirmation)}
                    errorMessage={transactionError}
                />
            )}
        </Modal>
    );
};

export default WithdrawModal;
