import { putEncryptionKey } from "encryption";
import { actionShowUALSoftkeyModal, useGlobalStore } from "_app";
import { actionSetEncryptionPassword } from "_app/actions";

export interface UALSoftKeyLoginHook {
    isOpen: boolean;
    show: () => Promise<string>;
    dismiss: (privateKey: string) => void;
    updateEncryptionPassword: (publicKey: string, privateKey: string) => void;
}

export const useUALSoftkeyLogin = (): UALSoftKeyLoginHook => {
    const { state, dispatch } = useGlobalStore();
    const { ualSoftkeyModal } = state;
    const { isOpen, resolver } = ualSoftkeyModal;

    const show = () => {
        // hack to send ual box behind
        const ualBox = document.getElementById("ual-box");
        if (ualBox && ualBox.parentElement) {
            const ualBoxModalOverlay = ualBox.parentElement;
            ualBoxModalOverlay.style.zIndex = "49"; // send behind our modal
        }

        return new Promise<string>((resolve) => {
            dispatch(actionShowUALSoftkeyModal(true, resolve));
        });
    };

    const dismiss = (privateKey: string) => {
        dispatch(actionShowUALSoftkeyModal(false, null));
        resolver?.(privateKey);
        console.info("password modal dismissed");

        // hack to send ual box back to their normal z-index
        const ualBox = document.getElementById("ual-box");
        if (ualBox && ualBox.parentElement) {
            const ualBoxModalOverlay = ualBox.parentElement;
            ualBoxModalOverlay.style.zIndex = "2147483647"; // original ual z-index
        }
    };

    const updateEncryptionPassword = (
        publicKey: string,
        privateKey: string
    ) => {
        putEncryptionKey(publicKey, privateKey);
        dispatch(actionSetEncryptionPassword(publicKey, privateKey));
    };

    return {
        isOpen,
        show,
        dismiss,
        updateEncryptionPassword,
    };
};
