import React from "react";

import { tokenConfig } from "config";
import { SetValuesEvent, useUALAccount } from "_app";
import { Asset, assetToLocaleString, assetToString } from "_app/utils";
import { Button, Form, Heading, Text } from "_app/ui";

import { WithdrawFundsFormFields } from "./withdraw-modal";

interface Props {
    availableFunds?: Asset;
    formState: [WithdrawFundsFormFields, SetValuesEvent];
    onPreview: (e: React.FormEvent) => Promise<void>;
    onCancel: () => void;
}

export const WithdrawModalStepForm = ({
    availableFunds,
    formState,
    onPreview,
    onCancel,
}: Props) => {
    const [ualAccount] = useUALAccount();
    const [fields, setFields] = formState;

    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFields(e);
    };

    const validateAccountField = (e: React.FormEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        if (target.validity.valueMissing) {
            target.setCustomValidity("Enter an account name");
        } else {
            target.setCustomValidity("Invalid account name");
        }
    };

    const validateAmountField = (e: React.FormEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement;
        if (target.validity.rangeOverflow) {
            target.setCustomValidity("Insufficient funds available");
        } else {
            target.setCustomValidity("Enter a valid withdrawal amount");
        }
    };

    const clearErrorMessages = (e: React.FormEvent<HTMLInputElement>) => {
        (e.target as HTMLInputElement).setCustomValidity("");
    };

    if (!availableFunds) return null;

    const maxWithdrawal = Number(
        assetToString(availableFunds!, availableFunds.precision).split(" ")[0]
    );

    const setMaxAmount = () =>
        setFields({ target: { id: "amount", value: maxWithdrawal } });

    const isThirdPartyWithdrawal = ualAccount.accountName !== formState[0].to;

    const amountInputPreventChangeOnScroll = (
        e: React.WheelEvent<HTMLInputElement>
    ) => (e.target as HTMLInputElement).blur();

    return (
        <div className="space-y-4">
            <Heading>Withdraw funds</Heading>
            <Text>
                Withdraw my funds from the Eden contract to a public{" "}
                {tokenConfig.symbol} account.
            </Text>
            <Text>
                Available:{" "}
                <span className="font-medium">
                    {assetToLocaleString(
                        availableFunds,
                        availableFunds.precision
                    )}
                </span>
            </Text>
            <form onSubmit={onPreview} className="space-y-3">
                <Form.LabeledSet
                    label={`${tokenConfig.symbol} account name (12 characters)`}
                    htmlFor="to"
                >
                    <Form.Input
                        id="to"
                        type="text"
                        required
                        value={fields.to}
                        onChange={onChangeFields}
                        maxLength={12}
                        pattern="^[a-z,1-5.]{1,12}$"
                        onInvalid={validateAccountField}
                        onInput={clearErrorMessages}
                    />
                </Form.LabeledSet>
                <Form.LabeledSet label="Amount to withdraw" htmlFor="amount">
                    <div className="flex space-x-2">
                        <div className="relative flex-1">
                            <Form.Input
                                id="amount"
                                type="number"
                                inputMode="decimal"
                                min={1 / Math.pow(10, tokenConfig.precision)}
                                max={maxWithdrawal}
                                step="any"
                                required
                                value={fields.amount}
                                onChange={onChangeFields}
                                maxLength={12}
                                onWheel={amountInputPreventChangeOnScroll}
                                onInvalid={validateAmountField}
                                onInput={clearErrorMessages}
                            />
                            <div className="absolute top-3 right-2">
                                <p className="text-sm text-gray-400">
                                    {availableFunds?.symbol}
                                </p>
                            </div>
                        </div>
                        <Button type="neutral" onClick={setMaxAmount}>
                            Max
                        </Button>
                    </div>
                </Form.LabeledSet>
                {isThirdPartyWithdrawal && (
                    <Form.LabeledSet label="Memo" htmlFor="memo">
                        <Form.Input
                            id="memo"
                            type="text"
                            value={fields.memo}
                            onChange={onChangeFields}
                        />
                    </Form.LabeledSet>
                )}
                <div className="flex space-x-3">
                    <Button type="neutral" onClick={onCancel} disabled={false}>
                        Cancel
                    </Button>
                    <Button isSubmit>Preview</Button>
                </div>
            </form>
        </div>
    );
};

export default WithdrawModalStepForm;
