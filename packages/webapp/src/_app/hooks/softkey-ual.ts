import { actionShowUALSoftkeyModal, useGlobalStore } from "_app";

export interface UALSoftKeyLoginHook {
    isOpen: boolean;
    show: () => Promise<string>;
    dismiss: (privateKey: string) => void;
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

        // hack to send ual box back to their normal z-index
        const ualBox = document.getElementById("ual-box");
        if (ualBox && ualBox.parentElement) {
            const ualBoxModalOverlay = ualBox.parentElement;
            ualBoxModalOverlay.style.zIndex = "2147483647"; // original ual z-index
        }
    };

    return {
        isOpen,
        show,
        dismiss,
    };
};
