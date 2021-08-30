import ReactModal from "react-modal";

import { Modal } from "_app/ui";

import ReenterPasswordPrompt from "./reenter-password-prompt";

interface Props {
    close: () => void;
    isOpen: boolean;
    onAfterClose?: () => void;
    onDismissConfirmation: () => void;
    isTooLateForCurrentRound?: boolean;
}

export const PromptReenterKeyModal = ({
    close,
    isOpen,
    onAfterClose,
    onDismissConfirmation,
    isTooLateForCurrentRound,
    ...props
}: Props & ReactModal.Props) => {
    return (
        <Modal
            isOpen={isOpen}
            onAfterClose={onAfterClose}
            onRequestClose={close}
            contentLabel="Meeting Link Activation Modal - Requesting Password"
            preventScroll
            shouldCloseOnOverlayClick
            shouldCloseOnEsc
            {...props}
        >
            <ReenterPasswordPrompt
                onCancel={close}
                onDismissConfirmation={onDismissConfirmation}
                isTooLateForCurrentRound={isTooLateForCurrentRound}
            />
        </Modal>
    );
};

export default PromptReenterKeyModal;
