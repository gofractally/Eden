import { useState } from "react";
import { ZoomAccountJWT } from "_api/zoom-commons";

export const useLocalStorage = (key: string, initialValue: any) => {
    if (typeof window === "undefined") {
        return [undefined, () => undefined];
    }

    // TODO: It would be much better to store this in a context reducer.
    // Stored values for different instances of this hook will get out of sync.
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error("invalid initial localstorage", error);
            return initialValue;
        }
    });

    const setValue = (value: any) => {
        try {
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;

            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error("can't set localstorage", error);
        }
    };

    return [storedValue, setValue];
};

export const useZoomLinkedAccount = (zoomLinkedAccount: boolean) =>
    useLocalStorage("zoomLinkedAccount", zoomLinkedAccount);
