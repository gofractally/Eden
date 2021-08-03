import { FaCheckCircle } from "react-icons/fa";
import { GoSync } from "react-icons/go";
import { Dayjs } from "dayjs";

import { Text } from "_app/ui";
import { CountdownPieMer } from "elections";

// TODO: Make more data-driven. E.g., infer if round is active based on time passed in, etc. Props will change.
export const RoundHeader = ({
    roundNum,
    isActive,
    startDateTime,
    endDateTime,
    subText,
}: {
    roundNum: number;
    isActive?: boolean;
    startDateTime?: Dayjs;
    endDateTime?: Dayjs;
    subText: string;
}) => {
    return (
        <div className="w-full flex justify-between">
            <div className="flex items-center space-x-2">
                {isActive ? (
                    <GoSync size={24} className="text-gray-400" />
                ) : (
                    <FaCheckCircle size={22} className="ml-px text-gray-400" />
                )}
                <div>
                    <Text size="sm" className="font-semibold">
                        Round {roundNum}
                    </Text>
                    <Text size="sm" className="tracking-tight">
                        {subText}
                    </Text>
                </div>
            </div>
            {isActive && startDateTime && endDateTime && (
                <CountdownPieMer
                    startTime={startDateTime.toDate()}
                    endTime={endDateTime.toDate()}
                />
            )}
        </div>
    );
};

export default RoundHeader;
