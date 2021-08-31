import { BsExclamationTriangle } from "react-icons/bs";

import { MemberStatus, useCurrentMember, useUALAccount } from "_app";
import { Button, Container } from "_app/ui";

import { useEncryptionPassword, usePasswordModal } from "../hooks";

interface Props {
    promptSetupEncryptionKey?: boolean;
}

export const EncryptionPasswordAlert = ({
    promptSetupEncryptionKey,
}: Props) => {
    const { show } = usePasswordModal();
    const {
        encryptionPassword,
        isPasswordNotSet,
        isPasswordSetNotPresent,
    } = useEncryptionPassword();

    const [ualAccount] = useUALAccount();
    const { data: currentMember } = useCurrentMember();
    const memberNotActive = currentMember?.status !== MemberStatus.ActiveMember;

    if (!encryptionPassword || !ualAccount || memberNotActive) {
        return null;
    }

    const promptNewKey = promptSetupEncryptionKey && isPasswordNotSet;
    const warnKeyNotPresent = isPasswordSetNotPresent;

    const showModal = () => {
        show();
    };

    if (promptNewKey) {
        return <PromptNewKey showModal={showModal} />;
    }

    if (warnKeyNotPresent) {
        return <NotPresentKeyWarning showModal={showModal} />;
    }

    return null;
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
