import { EncryptionPassword } from "encryption";
import React, { createContext, useReducer } from "react";

interface ContextType {
    state: State;
    dispatch: React.Dispatch<Action>;
}

type State = {
    encryptionPassword: EncryptionPassword;
};

type Action = { type: string; payload: any };

const initialState: State = { encryptionPassword: {} };
const store = createContext<ContextType | null>(null);
const { Provider } = store;

const StateProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(
        (state: State, action: Action): State => {
            switch (action.type) {
                case "SET_ENCRYPTION_PASSWORD":
                    return { ...state, encryptionPassword: action.payload };
                default:
                    throw new Error();
            }
        },
        initialState
    );

    return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export const Store = { store, StateProvider };
