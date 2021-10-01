import { useQueryClient } from "react-query";
import { v4 as uuidv4 } from "uuid";

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
            await fetch("/api/signout", {
                method: "POST",
                body: JSON.stringify({
                    signoutUuid: uuidv4(),
                }),
            });
        } catch (error) {
            console.error("error clearing cookies signing out", error as Error);
        }
        setZoomLinkedAccount(false);
        ualLogout();
    };

    return signOut;
};
