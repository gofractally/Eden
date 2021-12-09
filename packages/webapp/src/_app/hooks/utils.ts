import { useEffect, useState, useRef, RefObject } from "react";

// From: https://overreacted.io/making-setinterval-declarative-with-react-hooks
export const useInterval = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef<() => void>(() => {});

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        const tick = () => {
            savedCallback.current();
        };
        if (delay !== null) {
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
};

const now = () => new Date();
const padTime = (time: number) => time.toString().padStart(2, "0");

// From: https://usehooks-typescript.com/react-hook/use-timeout
export const useTimeout = (callback: () => void, delay: number | null) => {
    const savedCallback = useRef(callback);

    // Remember the latest callback if it changes.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the timeout.
    useEffect(() => {
        // Don't schedule if no delay is specified.
        if (delay === null) {
            return;
        }

        const id = setTimeout(() => savedCallback.current(), delay);

        return () => clearTimeout(id);
    }, [delay]);
};

interface Countdown {
    startTime?: Date;
    endTime: Date;
    onEnd?: () => void;
    interval?: number;
}

export const useCountdown = ({
    startTime = new Date(),
    endTime,
    onEnd,
    interval = 500,
}: Countdown) => {
    const [percentDecimal, setPercent] = useState<number>(0);

    const intervalDelay = percentDecimal > 1 ? null : interval;
    useInterval(() => {
        const elapsedTimeMs = now().getTime() - startTime.getTime();
        const durationMs = endTime.getTime() - startTime.getTime();
        const percentDecimal = elapsedTimeMs / durationMs;
        setPercent(percentDecimal);
        if (percentDecimal > 1) onEnd?.();
    }, intervalDelay);

    const msRemaining = Math.max(endTime.getTime() - now().getTime(), 0);
    const daysRemaining = Math.floor(msRemaining / 1000 / 60 / 60 / 24);
    const hrRemaining = Math.floor(msRemaining / 1000 / 60 / 60) % 24;
    const minRemaining = Math.floor(msRemaining / 1000 / 60) % 60;
    const secRemaining = Math.floor(msRemaining / 1000) % 60;

    return {
        msRemaining,
        secRemaining,
        minRemaining,
        hrRemaining,
        daysRemaining,
        percentDecimal,
        hmmss: `${Boolean(hrRemaining) ? hrRemaining + ":" : ""}${padTime(
            minRemaining
        )}:${padTime(secRemaining)}`,
        "d-h-m": `${Boolean(daysRemaining) ? daysRemaining + "d" : ""} ${
            Boolean(hrRemaining) ? hrRemaining + "h" : ""
        } ${Boolean(minRemaining) ? minRemaining + "m" : ""}`.trim(),
    };
};

// This gives us the ability to check prevProps
export const usePrevious = <T>(value: T): T => {
    const ref: any = useRef<T>();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
};

// Define general type for useWindowSize hook, which includes width and height
interface Size {
    width: number | undefined;
    height: number | undefined;
}

// https://usehooks.com/useWindowSize/
export const useWindowSize = (): Size => {
    // Initialize state with undefined width/height so server and client renders match
    // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
    const [windowSize, setWindowSize] = useState<Size>({
        width: undefined,
        height: undefined,
    });
    useEffect(() => {
        // Handler to call on window resize
        const handleResize = () => {
            // Set window width/height to state
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        // Add event listener
        window.addEventListener("resize", handleResize);
        // Call handler right away so state gets updated with initial window size
        handleResize();
        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []); // Empty array ensures that effect is only run on mount
    return windowSize;
};

export const useFocus = <T extends HTMLElement>(): [
    RefObject<T>,
    ((options?: FocusOptions | undefined) => void) | (() => void)
] => {
    const htmlElRef = useRef<T>(null);
    const setFocus = () => htmlElRef?.current?.focus() ?? {};
    return [htmlElRef, setFocus];
};
