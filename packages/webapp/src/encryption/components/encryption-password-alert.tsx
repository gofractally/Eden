import { useState } from "react";
import { BsExclamationTriangle } from "react-icons/bs";

import {
    Button,
    Container,
    MemberStatus,
    Modal,
    onError,
    useCurrentMember,
    useUALAccount,
} from "_app";

import { setEncryptionPublicKeyTransaction } from "../transactions";
import { UpdateEncryptionPassword, useEncryptionPassword } from "../hooks";
import { NewPasswordForm } from "./new-password-form";
import { ReenterPasswordForm } from "./reenter-password-form";

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
    const [forgotPassword, setForgotPassword] = useState(false);

    const [ualAccount] = useUALAccount();
    const { data: currentMember } = useCurrentMember();

    if (
        !encryptionPassword ||
        !ualAccount ||
        currentMember?.status !== MemberStatus.ActiveMember
    ) {
        return null;
    }

    const promptNewKey = forgotPassword ||
        (promptSetupEncryptionKey &&
        !isLoadingPassword &&
        !encryptionPassword.publicKey);
    if (promptNewKey) {
        return (
            <PromptNewKey 
                updateEncryptionPassword={updateEncryptionPassword} 
                forgotPassword={forgotPassword} 
            />
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
                triggerForgotPassword={() => setForgotPassword(true)}
            />
        );
    }

    return null;
};

interface PromptNewKeyProps {
    updateEncryptionPassword: UpdateEncryptionPassword;
    forgotPassword?: boolean;
}

const PromptNewKey = ({ updateEncryptionPassword, forgotPassword }: PromptNewKeyProps) => {
    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    return (
        <Container className="flex justify-center bg-yellow-500">
            <Button
                type="caution"
                size="sm"
                onClick={() => setShowNewKeyModal(!showNewKeyModal)}
            >
                <BsExclamationTriangle className="mr-1 mb-px" />
                {forgotPassword ? "Forgot Password" : "Create Election Password"}
            </Button>
            <PromptNewKeyModal
                updateEncryptionPassword={updateEncryptionPassword}
                isOpen={showNewKeyModal}
                close={() => setShowNewKeyModal(false)}
                forgotPassword={forgotPassword}
            />
        </Container>
    );
};

interface NotPresentKeyWarningProps {
    expectedPublicKey: string;
    updateEncryptionPassword: UpdateEncryptionPassword;
    triggerForgotPassword: () => void;
}

const NotPresentKeyWarning = ({
    expectedPublicKey,
    updateEncryptionPassword,
    triggerForgotPassword,
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
                onForgotPassword={() => setShowReenterKeyModal(false) && triggerForgotPassword()}
            />
        </Container>
    );
};

interface PasswordModalProps {
    isOpen: boolean;
    close: () => void;
    updateEncryptionPassword: UpdateEncryptionPassword;
    forgotPassword?: boolean;
}

const PromptNewKeyModal = ({
    isOpen,
    close,
    updateEncryptionPassword,
    forgotPassword,
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
            close();
        } catch (error) {
            console.error(error);
            onError(error);
        }

        setIsLoading(false);
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
            <NewPasswordForm
                isLoading={isLoading}
                onSubmit={onSubmit}
                onCancel={close}
                forgotPassword={forgotPassword}
            />
        </Modal>
    );
};

interface PromptReenterKeyModalProps extends PasswordModalProps {
    expectedPublicKey: string;
    onForgotPassword: () => void;
}

const PromptReenterKeyModal = ({
    isOpen,
    close,
    expectedPublicKey,
    updateEncryptionPassword,
    onForgotPassword,
}: PromptReenterKeyModalProps) => {
    const onSubmit = async (publicKey: string, privateKey: string) => {
        try {
            updateEncryptionPassword(publicKey, privateKey);
            close();
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
            <ReenterPasswordForm
                expectedPublicKey={expectedPublicKey}
                onSubmit={onSubmit}
                onCancel={close}
                onForgotPassword={onForgotPassword}
            />
        </Modal>
    );
};
