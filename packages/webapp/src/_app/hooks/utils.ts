import { useEffect, useState, useRef } from "react";

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
}

export const useCountdown = ({
    startTime = new Date(),
    endTime,
    onEnd,
}: Countdown) => {
    const [percentDecimal, setPercent] = useState<number>(0);

    const intervalDelay = percentDecimal > 1 ? null : 500;
    useInterval(() => {
        const elapsedTimeMs = now().getTime() - startTime.getTime();
        const durationMs = endTime.getTime() - startTime.getTime();
        const percentDecimal = elapsedTimeMs / durationMs;
        setPercent(percentDecimal);
        if (percentDecimal > 1) onEnd?.();
    }, intervalDelay);

    const msRemaining = Math.max(endTime.getTime() - now().getTime(), 0);
    const hrRemaining = Math.floor(msRemaining / 1000 / 60 / 60);
    const minRemaining = Math.floor(msRemaining / 1000 / 60) % 60;
    const secRemaining = Math.floor(msRemaining / 1000) % 60;

    return {
        msRemaining,
        secRemaining,
        minRemaining,
        hrRemaining,
        percentDecimal,
        hmmss: `${Boolean(hrRemaining) ? hrRemaining + ":" : ""}${padTime(
            minRemaining
        )}:${padTime(secRemaining)}`,
    };
};
