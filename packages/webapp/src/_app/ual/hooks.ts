import { useContext } from "react";
import { UALContext } from "ual-reactjs-renderer";

export const useUALAccount = () => {
    const ualContext = useContext<any>(UALContext);

    return [
        ualContext.activeUser,
        ualContext.activeUser ? ualContext.logout : null,
        ualContext.showModal,
    ];
};
