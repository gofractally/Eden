import { useState } from "react";
import dayjs from "dayjs";

import { useInterval } from "_app";
import { PieChart, Text } from "_app/ui";

interface Props {
    startTime: dayjs.Dayjs;
    endTime: dayjs.Dayjs;
    className?: string;
}

// TODO: What props come in will be informed by the data we're getting
// it might be less expensive here just to use strings or js dates
export const ElectionRoundCountdown = ({
    startTime,
    endTime,
    className = "",
}: Props) => {
    const [percent, setPercent] = useState<number>(0);
    const delay = percent > 100 ? null : 1000;
    useInterval(() => {
        const duration = endTime.diff(startTime);
        const elapsedTime = dayjs().diff(startTime);
        const percentElapsed = Math.round((elapsedTime / duration) * 100);
        setPercent(percentElapsed);
    }, delay);

    if (percent > 100) return <></>;

    let timeRemainingString = dayjs
        .duration(endTime.diff(dayjs()))
        .format("mm:ss");

    return (
        <div className={`flex items-center ${className}`}>
            <PieChart percent={percent} size={28} />
            <div className="flex-1 ml-2">
                <Text size="sm" className="font-semibold">
                    Vote Timer
                </Text>
                <Text size="sm">{timeRemainingString}</Text>
            </div>
        </div>
    );
};
