import ReactModal from "react-modal";

import { Modal } from "_app/ui";

import CreateNewPasswordPrompt from "./create-new-password-prompt";

interface Props {
    close: () => void;
    isOpen: boolean;
    onAfterClose?: () => void;
    onDismissConfirmation: () => void;
    isTooLateForCurrentRound?: boolean;
}

export const PromptCreateKeyModal = ({
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
            shouldCloseOnOverlayClick={false}
            shouldCloseOnEsc={false}
            {...props}
        >
            <CreateNewPasswordPrompt
                onCancel={close}
                onDismissConfirmation={onDismissConfirmation}
                isTooLateForCurrentRound={isTooLateForCurrentRound}
            />
        </Modal>
    );
};

export default PromptCreateKeyModal;
