import { useState } from "react";
import { BsExclamationTriangle } from "react-icons/bs";

import {
    MemberStatus,
    onError,
    queryMemberByAccountName,
    useCurrentMember,
    useUALAccount,
} from "_app";
import { Button, Container, Heading, Modal, Text } from "_app/ui";

import { setEncryptionPublicKeyTransaction } from "../transactions";
import { UpdateEncryptionPassword, useEncryptionPassword } from "../hooks";
import { NewPasswordForm } from "./new-password-form";
import { ReenterPasswordForm } from "./reenter-password-form";
import { useQueryClient } from "react-query";

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
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [showReenterKeyModal, setShowReenterKeyModal] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [ualAccount] = useUALAccount();
    const { data: currentMember } = useCurrentMember();

    const updatePassword = (publicKey: string, privateKey: string) => {
        updateEncryptionPassword(publicKey, privateKey);
        setIsSuccess(true);
    };

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

    const warnKeyNotPresent =
        !isLoadingPassword &&
        encryptionPassword.publicKey &&
        !encryptionPassword.privateKey;

    return (
        <>
            {promptNewKey ? (
                <PromptNewKey showModal={() => setShowNewKeyModal(true)} />
            ) : warnKeyNotPresent ? (
                <NotPresentKeyWarning
                    showModal={() => setShowReenterKeyModal(true)}
                />
            ) : null}
            <PromptNewKeyModal
                updateEncryptionPassword={updatePassword}
                isOpen={showNewKeyModal}
                isSuccess={isSuccess}
                close={() => setShowNewKeyModal(false)}
                onAfterClose={() => setIsSuccess(false)}
            />
            <PromptReenterKeyModal
                updateEncryptionPassword={updatePassword}
                expectedPublicKey={encryptionPassword.publicKey!}
                isOpen={showReenterKeyModal}
                isSuccess={isSuccess}
                close={() => setShowReenterKeyModal(false)}
                onAfterClose={() => setIsSuccess(false)}
            />
        </>
    );
};

interface PromptProps {
    showModal: () => void;
}

const PromptNewKey = ({ showModal }: PromptProps) => {
    return (
        <Container className="flex justify-center bg-yellow-500">
            <Button type="caution" size="sm" onClick={showModal}>
                <BsExclamationTriangle className="mr-1 mb-px" />
                Create Election Password
            </Button>
        </Container>
    );
};

const NotPresentKeyWarning = ({ showModal }: PromptProps) => {
    return (
        <Container className="flex justify-center bg-yellow-500">
            <Button type="caution" size="sm" onClick={showModal}>
                <BsExclamationTriangle className="mr-1 mb-px" />
                Enter Election Password
            </Button>
        </Container>
    );
};

interface PasswordModalProps {
    isOpen: boolean;
    isSuccess: boolean;
    close: () => void;
    onAfterClose: () => void;
    updateEncryptionPassword: UpdateEncryptionPassword;
}

const PromptNewKeyModal = ({
    isOpen,
    isSuccess,
    close,
    onAfterClose,
    updateEncryptionPassword,
}: PasswordModalProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [ualAccount] = useUALAccount();

    const onSubmit = async (publicKey: string, privateKey: string) => {
        setIsLoading(true);

        try {
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

            updateEncryptionPassword(publicKey, privateKey);
        } catch (error) {
            console.error(error);
            onError(error);
        }

        setIsLoading(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            onAfterClose={onAfterClose}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick={!isLoading}
            shouldCloseOnEsc={!isLoading}
        >
            {isSuccess ? (
                <PasswordSuccessConfirmation close={close} />
            ) : (
                <NewPasswordForm
                    isLoading={isLoading}
                    onSubmit={onSubmit}
                    onCancel={close}
                />
            )}
        </Modal>
    );
};

interface PromptReenterKeyModalProps extends PasswordModalProps {
    expectedPublicKey: string;
}

const PromptReenterKeyModal = ({
    isOpen,
    isSuccess,
    close,
    onAfterClose,
    expectedPublicKey,
    updateEncryptionPassword,
}: PromptReenterKeyModalProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [ualAccount] = useUALAccount();
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const queryClient = useQueryClient();

    const onSubmit = (publicKey: string, privateKey: string) => {
        try {
            updateEncryptionPassword(publicKey, privateKey);
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
            await new Promise((resolve) => setTimeout(resolve, 3000)); // allow time for chain tables to update

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

    return (
        <Modal
            isOpen={isOpen}
            onAfterClose={onAfterClose}
            onRequestClose={close}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick
            shouldCloseOnEsc
        >
            {isSuccess ? (
                <PasswordSuccessConfirmation close={close} />
            ) : forgotPasswordMode ? (
                <NewPasswordForm
                    isLoading={isLoading}
                    onSubmit={onSubmitForgotPassword}
                    onCancel={() => {
                        setForgotPasswordMode(false);
                        close();
                    }}
                    forgotPassword={true}
                />
            ) : (
                <ReenterPasswordForm
                    expectedPublicKey={expectedPublicKey}
                    onSubmit={onSubmit}
                    onCancel={close}
                    onForgotPassword={() => setForgotPasswordMode(true)}
                />
            )}
        </Modal>
    );
};

const PasswordSuccessConfirmation = ({ close }: { close: () => void }) => {
    return (
        <div className="space-y-4">
            <Heading>Success!</Heading>
            <Text>Your password is all set.</Text>
            <div className="flex space-x-3">
                <Button onClick={close}>OK</Button>
            </div>
        </div>
    );
};
