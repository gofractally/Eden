import { PrivateKey } from "eosjs/dist/PrivateKey";
import { useState } from "react";
import { BsExclamationTriangle } from "react-icons/bs";

import {
    Button,
    Container,
    Form,
    MemberStatus,
    Modal,
    onError,
    Text,
    useCurrentMember,
    useFormFields,
    useUALAccount,
} from "_app";
import { generateEncryptionKey } from "_app/eos/secret-publisher";
import { setEncryptionPublicKeyTransaction } from "encryption/transactions";

import { UpdateEncryptionPassword, useEncryptionPassword } from "../hooks";
import { useEffect } from "react";

interface Props {
    promptSetupEncryptionKey?: boolean;
}

export const EncryptionPasswordAlert = ({
    promptSetupEncryptionKey,
}: Props) => {
    const {
        encryptionPassword,
        updateEncryptionPassword,
        isLoading: isLoadingPassword,
    } = useEncryptionPassword();

    const [ualAccount] = useUALAccount();
    const { data: currentMember } = useCurrentMember();

    if (
        !encryptionPassword ||
        !ualAccount ||
        currentMember?.status !== MemberStatus.ActiveMember
    ) {
        return null;
    }

    const promptNewKey =
        promptSetupEncryptionKey &&
        !isLoadingPassword &&
        !encryptionPassword.publicKey;
    if (promptNewKey) {
        return (
            <PromptNewKey updateEncryptionPassword={updateEncryptionPassword} />
        );
    }

    const warnKeyNotPresent =
        !isLoadingPassword &&
        encryptionPassword.publicKey &&
        !encryptionPassword.privateKey;
    if (warnKeyNotPresent) {
        return (
            <NotPresentKeyWarning
                expectedPublicKey={encryptionPassword.publicKey!}
                updateEncryptionPassword={updateEncryptionPassword}
            />
        );
    }

    return null;
};

interface PromptNewKeyProps {
    updateEncryptionPassword: UpdateEncryptionPassword;
}

const PromptNewKey = ({ updateEncryptionPassword }: PromptNewKeyProps) => {
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    return (
        <Container className="flex justify-center bg-yellow-500">
            <Button
                type="caution"
                size="sm"
                onClick={() => setShowNewKeyModal(!showNewKeyModal)}
            >
                <BsExclamationTriangle className="mr-1 mb-px" />
                Create Election Password
            </Button>
            <PromptNewKeyModal
                updateEncryptionPassword={updateEncryptionPassword}
                isOpen={showNewKeyModal}
                close={() => setShowNewKeyModal(false)}
            />
        </Container>
    );
};

interface NotPresentKeyWarningProps {
    expectedPublicKey: string;
    updateEncryptionPassword: UpdateEncryptionPassword;
}

const NotPresentKeyWarning = ({
    expectedPublicKey,
    updateEncryptionPassword,
}: NotPresentKeyWarningProps) => {
    const [showReenterKeyModal, setShowReenterKeyModal] = useState(false);
    return (
        <Container className="flex justify-center bg-yellow-500">
            <Button
                type="caution"
                size="sm"
                onClick={() => setShowReenterKeyModal(!showReenterKeyModal)}
            >
                <BsExclamationTriangle className="mr-1 mb-px" />
                Enter Election Password
            </Button>
            <PromptReenterKeyModal
                updateEncryptionPassword={updateEncryptionPassword}
                isOpen={showReenterKeyModal}
                close={() => setShowReenterKeyModal(false)}
                expectedPublicKey={expectedPublicKey}
            />
        </Container>
    );
};

interface PasswordModalProps {
    isOpen: boolean;
    close: () => void;
    updateEncryptionPassword: UpdateEncryptionPassword;
}

const PromptNewKeyModal = ({
    isOpen,
    close,
    updateEncryptionPassword,
}: PasswordModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [ualAccount] = useUALAccount();

    const [copyText, setCopyText] = useState("Copy");
    const [fields, setFields] = useFormFields({
        password: generateEncryptionKey().privateKey.toLegacyString(),
        passwordConfirmation: "",
    });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const resetForm = () => {
        setCopyText("Copy");
        setFields({
            target: {
                id: "password",
                value: generateEncryptionKey().privateKey.toLegacyString(),
            },
        });
        setFields({
            target: {
                id: "passwordConfirmation",
                value: "",
            },
        });
    };
    useEffect(resetForm, [isOpen]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (fields.password !== fields.passwordConfirmation) {
            onError(new Error("Password confirmation does not match."));
            return;
        }

        setIsLoading(true);

        try {
            const publicKey = PrivateKey.fromString(
                fields.password
            ).getPublicKey();

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

            updateEncryptionPassword(
                publicKey.toLegacyString(),
                fields.password
            );

            close();
        } catch (error) {
            console.error(error);
            onError(error);
        }

        setIsLoading(false);
    };

    const copyPassword = () => {
        navigator.clipboard.writeText(fields.password);
        setCopyText("Copied!");
    };

    return (
        <Modal
            isOpen={isOpen}
            title="New password"
            onRequestClose={close}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick={!isLoading}
            shouldCloseOnEsc={!isLoading}
        >
            <div className="space-y-4">
                <Text>
                    It looks like you don’t have a password set to participate
                    in the election. Please copy your password and confirm it
                    here.
                </Text>
                <Text>Copy Password</Text>
                <form onSubmit={onSubmit} className="space-y-3">
                    <Form.LabeledSet
                        label="Your Election Password"
                        htmlFor="password"
                        className="col-span-6 sm:col-span-3"
                    >
                        <Form.Input
                            id="password"
                            type="text"
                            disabled
                            required
                            value={fields.password}
                            onChange={onChangeFields}
                        />
                        <Button onClick={copyPassword}>{copyText}</Button>
                    </Form.LabeledSet>
                    <Text>Please paste your password below.</Text>
                    <Form.LabeledSet
                        label="Confirm Your Election Password"
                        htmlFor="passwordConfirmation"
                        className="col-span-6 sm:col-span-3"
                    >
                        <Form.Input
                            id="passwordConfirmation"
                            type="text"
                            required
                            value={fields.passwordConfirmation}
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
                            disabled={!fields.passwordConfirmation || isLoading}
                        >
                            {isLoading ? "Submitting..." : "Submit"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

interface PromptReenterKeyModalProps extends PasswordModalProps {
    expectedPublicKey: string;
}

const PromptReenterKeyModal = ({
    isOpen,
    close,
    expectedPublicKey,
    updateEncryptionPassword,
}: PromptReenterKeyModalProps) => {
    const [fields, setFields] = useFormFields({
        password: "",
    });
    const onChangeFields = (e: React.ChangeEvent<HTMLInputElement>) =>
        setFields(e);

    const resetForm = () => {
        setFields({
            target: {
                id: "password",
                value: "",
            },
        });
    };
    useEffect(resetForm, [isOpen]);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const publicKey = PrivateKey.fromString(
                fields.password
            ).getPublicKey();

            if (publicKey.toLegacyString() !== expectedPublicKey) {
                onError(new Error("The entered password is not correct"));
                return;
            }

            updateEncryptionPassword(
                publicKey.toLegacyString(),
                fields.password
            );
            close();

            setFields({
                target: {
                    id: "password",
                    value: "",
                },
            });
        } catch (error) {
            console.error(error);
            onError(error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Re-enter password"
            onRequestClose={close}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick
            shouldCloseOnEsc
        >
            <div className="space-y-4">
                <Text>Please enter your Eden Election Password below.</Text>
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
                        <Button type="neutral" onClick={close}>
                            Cancel
                        </Button>
                        <Button isSubmit disabled={!fields.password}>
                            Submit
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};
