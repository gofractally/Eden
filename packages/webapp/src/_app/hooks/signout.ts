import { useQueryClient } from "react-query";
import { useUALAccount, useZoomLinkedAccount } from "_app";

export const useSignOut = () => {
    const queryClient = useQueryClient();
    const [_ualAccount, ualLogout] = useUALAccount();
    const [_zoomLinkedAccount, setZoomLinkedAccount] = useZoomLinkedAccount(
        false
    );

    const signOut = async () => {
        queryClient.clear();
        try {
            await fetch("/api/signout");
        } catch (error) {
            console.error("error clearing cookies signing out", error as Error);
        }
        setZoomLinkedAccount(false);
        ualLogout();
    };

    return signOut;
};
