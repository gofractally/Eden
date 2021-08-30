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
    const { encryptionPassword, isLoading } = useEncryptionPassword();
    const { publicKey, privateKey } = encryptionPassword;

    const [showFixPasswordModal, setShowFixPasswordModal] = useState(false);

    const [ualAccount] = useUALAccount();
    const { data: currentMember } = useCurrentMember();
    const memberNotActive = currentMember?.status !== MemberStatus.ActiveMember;

    if (!encryptionPassword || !ualAccount || memberNotActive) {
        return null;
    }

    const promptNewKey = promptSetupEncryptionKey && !isLoading && !publicKey;
    const warnKeyNotPresent = !isLoading && publicKey && !privateKey;

    const showPasswordModal = () => setShowFixPasswordModal(true);
    const hidePasswordModal = () => setShowFixPasswordModal(false);

    return (
        <>
            {promptNewKey ? (
                <PromptNewKey showModal={showPasswordModal} />
            ) : warnKeyNotPresent ? (
                <NotPresentKeyWarning showModal={showPasswordModal} />
            ) : null}
            <PromptCreateKeyModal
                isOpen={showFixPasswordModal} // only opens if password unset
                close={hidePasswordModal}
                onDismissConfirmation={hidePasswordModal}
            />
            <PromptReenterKeyModal
                isOpen={showFixPasswordModal} // only opens if password set but missing locally
                close={hidePasswordModal}
                onDismissConfirmation={hidePasswordModal}
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
