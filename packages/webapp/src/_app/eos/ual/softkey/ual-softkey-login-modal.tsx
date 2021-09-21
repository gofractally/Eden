import React from "react";
import { PrivateKey } from "eosjs/dist/eosjs-jssig";

import { onError } from "_app";
import { generateEncryptionKey } from "_app/eos";
import { useFormFields } from "_app/hooks";
import { Button, Form, Modal } from "_app/ui";

import { useUALSoftkeyLogin } from "./hooks";

export const UalSoftkeyLoginModal = () => {
    const { isOpen, dismiss } = useUALSoftkeyLogin();
    const [fields, setFields] = useFormFields({
        password: "",
    });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const close = () => {
        alert(
            "You can't close the authentication modal without confirming or cancelling the password form."
        );
    };

    const clearPassword = () => {
        setFields({ target: { id: "password", value: "" } });
    };

    const onCancel = () => {
        clearPassword();
        dismiss("");
    };

    const doSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (fields.password.length < 12) {
            onError(
                new Error("Password must be at least 12 characters"),
                "Incorrect password"
            );
            return;
        }

        let key: string;
        try {
            const privateKey = PrivateKey.fromString(fields.password);
            key = privateKey.toLegacyString();
        } catch (e) {
            // if the entered password is not a valid key we derive the password
            key = generateEncryptionKey(
                fields.password
            ).privateKey.toLegacyString();
        }

        clearPassword();
        dismiss(key);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            contentLabel="UAL SoftKey Login"
            preventScroll
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
        >
            <form onSubmit={doSubmit} className="space-y-3">
                <Form.LabeledSet
                    label="Enter your account password"
                    htmlFor="password"
                    className="col-span-6 sm:col-span-3"
                >
                    <Form.Input
                        id="password"
                        type="password"
                        required
                        value={fields.password}
                        onChange={onChangeFields}
                    />
                </Form.LabeledSet>
                <div className="flex space-x-3">
                    <Button type="neutral" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button isSubmit>Submit</Button>
                </div>
            </form>
        </Modal>
    );
};
