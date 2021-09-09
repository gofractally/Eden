import {
    actionShowPasswordModal,
    actionShowUALSoftkeyModal,
    useGlobalStore,
} from "_app";

// TODO: This should commit to localstorage the test user's private key (similar to useEncryptionPassword?) so that it's available to the UAL signing and get key methods.
export const useUALSoftkeyLogin = () => {
    const { state, dispatch } = useGlobalStore();
    const { ualSoftkeyModal } = state;
    const { isOpen, resolver } = ualSoftkeyModal;

    const show = () =>
        new Promise((resolve) => {
            dispatch(actionShowUALSoftkeyModal(true, resolve));
        });

    const dismiss = () => {
        dispatch(actionShowPasswordModal(false, null));
        resolver?.(true);
    };

    return {
        isOpen,
        show,
        dismiss,
    };
};
