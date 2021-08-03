import { FaCheckCircle } from "react-icons/fa";
import { GoSync } from "react-icons/go";
import dayjs, { Dayjs } from "dayjs";

import { Text } from "_app/ui";
import { CountdownPieMer } from "elections";

type RoundHeaderProps =
    | { roundData: any; roundNum?: number; subText?: string }
    | { roundData?: any; roundNum: number; subText: string };

export const RoundHeader = ({
    roundData,
    roundNum,
    subText,
}: RoundHeaderProps) => {
    const isActive = Boolean(roundData);
    const endsAt = isActive && dayjs(roundData.round_end + "Z");
    const startsAt = endsAt && endsAt.subtract(40, "minute");
    let subHeader = subText;

    if (!subText && startsAt && endsAt) {
        subHeader = `${startsAt.format("LT")} - ${endsAt.format("LT z")}`;
    }

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
                        Round {roundNum ?? roundData.round}
                    </Text>
                    <Text size="sm" className="tracking-tight">
                        {subHeader}
                    </Text>
                </div>
            </div>
            {isActive && startsAt && endsAt && (
                <CountdownPieMer
                    startTime={startsAt.toDate()}
                    endTime={endsAt.toDate()}
                />
            )}
        </div>
    );
};

export default RoundHeader;
