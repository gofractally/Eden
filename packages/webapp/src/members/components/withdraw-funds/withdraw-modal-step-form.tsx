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

    if (!availableFunds) return null;

    const maxWithdrawal = Number(
        assetToString(availableFunds!, availableFunds.precision).split(" ")[0]
    );

    const isThirdPartyWithdrawal = ualAccount.accountName !== formState[0].to;

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
                <Form.ChainAccountInput
                    id="to"
                    onChange={onChangeFields}
                    value={fields.to}
                    required
                />
                <Form.AssetInput
                    id="amount"
                    label="Amount to withdraw"
                    max={maxWithdrawal}
                    required
                    value={fields.amount}
                    onChange={onChangeFields}
                />
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
