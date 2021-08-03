import React, { useState } from "react";

import { useFormFields } from "_app";
import { Button, Form, Modal, Text } from "_app/ui";

interface ModalProps {
    isOpen: boolean;
    close: () => void;
}

export const PasswordPromptModal = ({ isOpen, close }: ModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fields, setFields] = useFormFields({ password: "" });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setIsLoading(false);
        setFields({ target: { id: "password", value: "" } });
        close();
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Activate Meeting Link"
            onRequestClose={close}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick={!isLoading}
            shouldCloseOnEsc={!isLoading}
        >
            <div className="space-y-4">
                <Text>
                    Enter your election password below to activate your meeting
                    links on this device.
                </Text>
                <form onSubmit={onSubmit} className="space-y-3">
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
                            onChange={onChangeFields}
                        />
                    </Form.LabeledSet>
                    <div className="flex space-x-3">
                        <Button
                            type="neutral"
                            onClick={close}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            isSubmit
                            isLoading={isLoading}
                            disabled={!fields.password || isLoading}
                        >
                            {isLoading ? "Submitting..." : "Submit"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default PasswordPromptModal;
