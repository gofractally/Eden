import { useMemo, useState } from "react";

import { useInterval } from "_app";
import { PieStatusIndicator, Text } from "_app/ui";

const now = () => new Date();
const padTime = (time: number) => (time < 10 ? `0${time}` : time);

interface Props {
    startTime: Date;
    endTime: Date;
    className?: string;
}

export const CountdownPieMer = ({
    startTime,
    endTime,
    className = "",
}: Props) => {
    const [percentDecimal, setPercent] = useState<number>(0);
    const percent = Math.round(percentDecimal * 100);

    const delay = percent > 100 ? null : 500;

    const durationMs = useMemo(
        () => endTime.getTime() - startTime.getTime(),
        []
    );

    useInterval(() => {
        const elapsedTimeMs = now().getTime() - startTime.getTime();
        setPercent(elapsedTimeMs / durationMs);
    }, delay);

    if (percent > 100) return <></>;

    const timeRemaining = new Date(endTime.getTime() - now().getTime());
    const minutesRemaining = timeRemaining.getMinutes();
    const secondsRemaining = timeRemaining.getSeconds();

    return (
        <div className={`flex items-center ${className}`}>
            <PieStatusIndicator percent={percent} size={28} />
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
