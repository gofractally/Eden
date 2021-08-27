import { useState } from "react";
import { BsExclamationTriangle } from "react-icons/bs";

import { MemberStatus, useCurrentMember, useUALAccount } from "_app";
import { Button, Container, Modal } from "_app/ui";

import ReenterPasswordPrompt from "./reenter-password-prompt";
import CreateNewPasswordPrompt from "./create-new-password-prompt";
import { UpdateEncryptionPassword, useEncryptionPassword } from "../hooks";

interface Props {
    promptSetupEncryptionKey?: boolean;
}

export const EncryptionPasswordAlert = ({
    promptSetupEncryptionKey,
}: Props) => {
    const encryptionPasswordResult = useEncryptionPassword();
    const {
        encryptionPassword,
        updateEncryptionPassword,
        isLoading: isLoadingPassword,
    } = encryptionPasswordResult;

    const [showNewKeyModal, setShowNewKeyModal] = useState(false);
    const [showReenterKeyModal, setShowReenterKeyModal] = useState(false);

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
                updateEncryptionPassword={updateEncryptionPassword}
                isOpen={showNewKeyModal}
                close={() => setShowNewKeyModal(false)}
            />
            <PromptReenterKeyModal
                encryptionPassword={encryptionPasswordResult}
                isOpen={showReenterKeyModal}
                close={() => setShowReenterKeyModal(false)}
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
                Create election password
            </Button>
        </Container>
    );
};

const NotPresentKeyWarning = ({ showModal }: PromptProps) => {
    return (
        <Container className="flex justify-center bg-yellow-500">
            <Button type="caution" size="sm" onClick={showModal}>
                <BsExclamationTriangle className="mr-1 mb-px" />
                Enter election password
            </Button>
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
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
        >
            <CreateNewPasswordPrompt
                onCancel={close}
                onDismissConfirmation={close}
                updateEncryptionPassword={updateEncryptionPassword}
            />
        </Modal>
    );
};

interface PromptReenterKeyModalProps {
    isOpen: boolean;
    close: () => void;
    encryptionPassword: ReturnType<typeof useEncryptionPassword>;
}

const PromptReenterKeyModal = ({
    isOpen,
    close,
    encryptionPassword,
}: PromptReenterKeyModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={close}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick
            shouldCloseOnEsc
        >
            <ReenterPasswordPrompt
                onCancel={close}
                onDismissConfirmation={close}
                encryptionPassword={encryptionPassword}
            />
        </Modal>
    );
};
