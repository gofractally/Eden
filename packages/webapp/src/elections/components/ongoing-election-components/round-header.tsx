import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { FaCheckCircle } from "react-icons/fa";
import { GoSync } from "react-icons/go";

import { Text } from "_app/ui";
import { VotePieMer } from "elections";

type RoundHeaderProps =
    | {
          roundStartTime: Dayjs;
          roundEndTime: Dayjs;
          roundIndex: number;
          subText?: string;
          headlineText?: string;
      }
    | {
          roundStartTime?: Dayjs;
          roundEndTime?: Dayjs;
          roundIndex: number;
          subText: string;
          headlineText?: string;
      };

export const RoundHeader = ({
    roundStartTime,
    roundEndTime,
    roundIndex,
    subText,
    headlineText,
}: RoundHeaderProps) => {
    const now = dayjs();
    const isActive = Boolean(
        roundStartTime &&
            roundEndTime &&
            now.isAfter(roundStartTime) &&
            now.isBefore(roundEndTime)
    );

    let subHeader = subText;

    const [shouldShowTimer, setShouldShowTimer] = useState<boolean>(isActive);

    if (!subText && roundStartTime && roundEndTime) {
        subHeader = `${roundStartTime.format("LT")} - ${roundEndTime.format(
            "LT z"
        )}`;
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
                        {headlineText ?? `Round ${roundIndex + 1}`}
                    </Text>
                    <Text size="sm" className="tracking-tight">
                        {subHeader}
                    </Text>
                </div>
            </div>
            {shouldShowTimer && (
                <VotePieMer
                    startTime={roundStartTime!.toDate()}
                    endTime={roundEndTime!.toDate()}
                    onEnd={() => setShouldShowTimer(false)}
                />
            )}
        </div>
    );
};

export default RoundHeader;
