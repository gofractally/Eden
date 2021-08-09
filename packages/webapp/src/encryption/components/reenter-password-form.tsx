import { useState } from "react";
import { PrivateKey } from "eosjs/dist/eosjs-key-conversions";

import { Button, Form, onError, Text, useFormFields } from "_app";

interface Props {
    expectedPublicKey: string;
    isLoading?: boolean;
    onSubmit: (publicKey: string, privateKey: string) => Promise<void>;
    onCancel: () => void;
}

export const ReenterPasswordForm = ({
    expectedPublicKey,
    isLoading,
    onSubmit,
    onCancel,
}: Props) => {
    const [fields, setFields] = useFormFields({
        password: "",
    });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const doSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const publicKey = PrivateKey.fromString(
                fields.password
            ).getPublicKey();

            if (publicKey.toLegacyString() !== expectedPublicKey) {
                onError(new Error("The entered password is not correct"));
                return;
            }
            await onSubmit(publicKey.toLegacyString(), fields.password);
        } catch (error) {
            console.error(error);
            onError(error);
        }
    };

    return (
        <div className="space-y-4">
            <Text>Please enter your Eden Election Password below.</Text>
            <form onSubmit={doSubmit} className="space-y-3">
                <Form.LabeledSet
                    label="Your Election Password"
                    htmlFor="password"
                    className="col-span-6 sm:col-span-3"
                >
                    <Form.Input
                        id="password"
                        type="text"
                        required
                        value={fields.password}
                        disabled={isLoading}
                        onChange={onChangeFields}
                    />
                </Form.LabeledSet>
                <div className="flex space-x-3">
                    <Button type="neutral" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button isSubmit disabled={!fields.password || isLoading}>
                        Submit
                    </Button>
                </div>
            </form>
        </div>
    );
};
