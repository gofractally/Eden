import PromptCreateKeyModal from "./prompt-create-key-modal";
import PromptReenterKeyModal from "./prompt-reenter-key-modal";
import { usePasswordModal } from "../hooks";

export const EncryptionPasswordModals = () => {
    const { isOpen, dismiss } = usePasswordModal();

    const onCancel = () => {
        dismiss();
    };

    const onDismissSuccessMessage = () => {
        dismiss(true);
    };

    return (
        <>
            <PromptCreateKeyModal
                isOpen={isOpen} // only opens if password unset
                close={onCancel}
                onDismissConfirmation={onDismissSuccessMessage}
            />
            <PromptReenterKeyModal
                isOpen={isOpen} // only opens if password set but missing locally
                close={onCancel}
                onDismissConfirmation={onDismissSuccessMessage}
            />
        </>
    );
};

export default EncryptionPasswordModals;
