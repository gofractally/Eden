import { useState } from "react";
import { ZoomAccountJWT } from "_api/zoom-commons";

export const useLocalStorage = (key: string, initialValue: any) => {
    if (typeof window === "undefined") {
        return [undefined, () => undefined];
    }

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

export const useZoomAccountJWT = (zoomAccountJWT?: ZoomAccountJWT) =>
    useLocalStorage("zoomAccountJWT", zoomAccountJWT);
