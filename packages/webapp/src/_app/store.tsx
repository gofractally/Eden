import { EncryptionPassword } from "encryption";
import React, { createContext, useContext, useMemo, useReducer } from "react";

import { ActionType } from "./actions";

interface ContextType {
    state: State;
    dispatch: React.Dispatch<Action>;
}

type State = {
    encryptionPassword: EncryptionPassword;
};

type Action = { type: ActionType; payload: any };

const initialState: State = { encryptionPassword: {} };
const store = createContext<ContextType | null>(null);
const { Provider } = store;

const reducer = (state: State, action: Action): State => {
    const { type, payload } = action;
    switch (type) {
        case ActionType.SetEncryptionPassword:
            return { ...state, encryptionPassword: payload };
        default:
            return state;
    }
};

const StateProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // ensure unrelated <WebApp /> rerenders of provider do not cause consumers to rerender
    // https://hswolff.com/blog/how-to-usecontext-with-usereducer/#performance-concerns
    const contextValue = useMemo(() => {
        return { state, dispatch };
    }, [state, dispatch]);

    return <Provider value={contextValue}>{children}</Provider>;
};

export const Store = { store, StateProvider };

export const useGlobalStore = () => {
    const globalStore = useContext(Store.store);
    if (!globalStore) throw new Error("hook should be within store provider");
    return globalStore;
};
