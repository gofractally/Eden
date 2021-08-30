import { useState } from "react";
import ReactModal from "react-modal";

import { Modal } from "_app/ui";
import { useEncryptionPassword } from "encryption";

import ReenterPasswordPrompt from "./reenter-password-prompt";

interface Props {
    close: () => void;
    isOpen?: boolean;
    onAfterOpen?: () => void;
    onAfterClose?: () => void;
    onDismissConfirmation: () => void;
    isTooLateForCurrentRound?: boolean;
}

/**
 * This modal will only open if `isOpen` is `true` and password is missing locally
 */
export const PromptReenterKeyModal = ({
    close,
    isOpen,
    onAfterOpen,
    onAfterClose,
    onDismissConfirmation,
    isTooLateForCurrentRound,
    ...props
}: Props & ReactModal.Props) => {
    const { encryptionPassword, isLoading } = useEncryptionPassword();
    const { publicKey, privateKey } = encryptionPassword;
    const isPasswordMissing = Boolean(!isLoading && publicKey && !privateKey);

    // keeps the modal open even after the isPasswordMissing condition updates on success
    // this ensures the modal remains open to show the user the success message
    const [isReenteringPassword, setIsReenteringPassword] = useState(false);

    const onAfterOpenHandler = () => {
        setIsReenteringPassword(true);
        onAfterOpen?.();
    };

    const onCloseHandler = () => {
        setIsReenteringPassword(false);
        close();
    };

    const onSuccessDismissHandler = () => {
        setIsReenteringPassword(false);
        onDismissConfirmation();
    };

    return (
        <Modal
            isOpen={isOpen && (isPasswordMissing || isReenteringPassword)}
            onAfterClose={onAfterClose}
            onAfterOpen={onAfterOpenHandler}
            onRequestClose={onCloseHandler}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick
            shouldCloseOnEsc
            {...props}
        >
            <ReenterPasswordPrompt
                onCancel={onCloseHandler}
                onDismissConfirmation={onSuccessDismissHandler}
                isTooLateForCurrentRound={isTooLateForCurrentRound}
            />
        </Modal>
    );
};

export default PromptReenterKeyModal;
