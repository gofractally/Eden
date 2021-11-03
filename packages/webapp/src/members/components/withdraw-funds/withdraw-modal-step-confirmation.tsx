import React from "react";

import { assetFromNumber, assetToLocaleString, useUALAccount } from "_app";
import { Button, Heading, Text } from "_app/ui";

import { WithdrawFundsFormFields } from "./withdraw-modal";

interface Props {
    formValues: WithdrawFundsFormFields;
    goBack: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

export const WithdrawModalStepConfirmation = ({
    formValues,
    goBack,
    onConfirm,
    isLoading,
}: Props) => {
    const [ualAccount] = useUALAccount();
    if (!ualAccount?.accountName) return null; // TODO: dismiss modal

    const amountAsAsset = assetFromNumber(formValues.amount);
    const isThirdPartyWithdrawal = ualAccount.accountName !== formValues.to;

    return (
        <div className="space-y-4">
            <Heading>
                Confirm withdrawal{isThirdPartyWithdrawal && " and transfer"}
            </Heading>
            <Text>Please confirm the following details:</Text>
            <ul className="list-inside list-disc">
                <li>
                    <Text className="inline">To: </Text>
                    <Text className="inline" type="info">
                        {formValues.to}
                    </Text>
                    {isThirdPartyWithdrawal && (
                        <Text className="inline italic" type="note">
                            {" "}
                            via {ualAccount.accountName}
                        </Text>
                    )}
                </li>
                <li>
                    <Text className="inline">Amount: </Text>
                    <Text className="inline" type="info">
                        {assetToLocaleString(
                            amountAsAsset,
                            amountAsAsset.precision
                        )}
                    </Text>
                </li>
                {isThirdPartyWithdrawal && formValues.memo ? (
                    <li>
                        <Text className="inline">Memo: </Text>
                        <Text className="inline" type="info">
                            {formValues.memo}
                        </Text>
                    </li>
                ) : null}
            </ul>
            {isThirdPartyWithdrawal && (
                <Text>
                    These funds will first be withdrawn to your Eden EOS account
                    of record (
                    <span className="font-medium">
                        {ualAccount.accountName}
                    </span>
                    ) and then transferred from your EOS account to{" "}
                    <span className="font-medium">{formValues.to}</span>. This
                    will happen within a single transaction.
                </Text>
            )}
            <div className="flex space-x-3">
                <Button type="neutral" onClick={goBack}>
                    Make Changes
                </Button>
                <Button
                    onClick={onConfirm}
                    isLoading={isLoading}
                    disabled={isLoading}
                >
                    Withdraw
                </Button>
            </div>
        </div>
    );
};

export default WithdrawModalStepConfirmation;
