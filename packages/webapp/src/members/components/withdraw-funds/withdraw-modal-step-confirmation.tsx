import React from "react";

import { tokenConfig } from "config";
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
    if (!ualAccount?.accountName) return null;

    const amountAsAsset = assetFromNumber(formValues.amount);
    const isThirdPartyWithdrawal = ualAccount.accountName !== formValues.to;

    return (
        <div className="space-y-4">
            <Heading>
                Confirm withdrawal{isThirdPartyWithdrawal && " and transfer"}
            </Heading>
            <Text>
                Your funds will be withdrawn from the Eden contract and sent to
                the {tokenConfig.symbol} account below. Please confirm the
                following details:
            </Text>
            <ul className="space-y-1">
                <li>
                    <Text>
                        Destination:{" "}
                        <span className="font-medium">{formValues.to}</span>{" "}
                        {isThirdPartyWithdrawal && (
                            <span className="italic">
                                via {ualAccount.accountName}
                            </span>
                        )}
                    </Text>
                </li>
                <li>
                    <Text>
                        Amount:{" "}
                        <span className="font-medium">
                            {assetToLocaleString(
                                amountAsAsset,
                                amountAsAsset.precision
                            )}
                        </span>
                    </Text>
                </li>
                {isThirdPartyWithdrawal && formValues.memo ? (
                    <li>
                        <Text>
                            Memo:{" "}
                            <span className="font-medium">
                                {formValues.memo}
                            </span>
                        </Text>
                    </li>
                ) : null}
            </ul>
            {isThirdPartyWithdrawal && (
                <Text>
                    Funds will be withdrawn to your Eden {tokenConfig.symbol}{" "}
                    account of record (
                    <span className="font-medium">
                        {ualAccount.accountName}
                    </span>
                    ) and transferred from your {tokenConfig.symbol} account to{" "}
                    <span className="font-medium">{formValues.to}</span> within
                    a single transaction.
                </Text>
            )}
            <div className="flex space-x-3">
                <Button type="neutral" onClick={goBack}>
                    Edit
                </Button>
                <Button
                    onClick={onConfirm}
                    isLoading={isLoading}
                    disabled={isLoading}
                >
                    Withdraw now
                </Button>
            </div>
        </div>
    );
};

export default WithdrawModalStepConfirmation;
