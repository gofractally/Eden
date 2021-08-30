import { useState } from "react";
import { BsExclamationTriangle } from "react-icons/bs";

import { MemberStatus, useCurrentMember, useUALAccount } from "_app";
import { Button, Container } from "_app/ui";

import PromptCreateKeyModal from "./prompt-create-key-modal";
import PromptReenterKeyModal from "./prompt-reenter-key-modal";
import { useEncryptionPassword } from "../hooks";

interface Props {
    promptSetupEncryptionKey?: boolean;
}

export const EncryptionPasswordAlert = ({
    promptSetupEncryptionKey,
}: Props) => {
    const {
        encryptionPassword,
        isLoading: isLoadingPassword,
    } = useEncryptionPassword();

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
            <PromptCreateKeyModal
                isOpen={showNewKeyModal}
                close={() => setShowNewKeyModal(false)}
                onDismissConfirmation={() => setShowNewKeyModal(false)}
            />
            <PromptReenterKeyModal
                isOpen={showReenterKeyModal}
                close={() => setShowReenterKeyModal(false)}
                onDismissConfirmation={() => setShowReenterKeyModal(false)}
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
