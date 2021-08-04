import { useState } from "react";

import { useInterval } from "_app";
import { PieStatusIndicator, Text } from "_app/ui";

const now = () => new Date();
const padTime = (time: number) => (time < 10 ? `0${time}` : time);

interface Props {
    startTime: Date;
    endTime: Date;
    className?: string;
    onEnd?: () => void;
}

export const CountdownPieMer = ({
    startTime,
    endTime,
    className = "",
    onEnd,
}: Props) => {
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
    const minutesRemaining = Math.floor(msRemaining / 1000 / 60);
    const secondsRemaining = Math.floor((msRemaining / 1000) % 60);

    return (
        <div className={`flex items-center ${className}`}>
            <PieStatusIndicator
                percent={Math.round(percentDecimal * 100)}
                size={28}
            />
            <div className="flex-1 ml-2">
                <Text size="sm" className="font-semibold">
                    Vote Timer
                </Text>
                <Text size="sm">
                    {padTime(minutesRemaining)}:{padTime(secondsRemaining)}
                </Text>
            </div>
        </div>
    );
};
