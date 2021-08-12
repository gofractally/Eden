import { useState } from "react";
import dayjs from "dayjs";
import { FaCheckCircle } from "react-icons/fa";
import { GoSync } from "react-icons/go";

import { Text } from "_app/ui";
import { VotePieMer } from "elections";

type RoundHeaderProps =
    | {
          roundEndTime: string;
          roundIndex: number;
          subText?: string;
          headlineText?: string;
      }
    | {
          roundEndTime?: string;
          roundIndex: number;
          subText: string;
          headlineText?: string;
      };

export const RoundHeader = ({
    roundEndTime,
    roundIndex,
    subText,
    headlineText,
}: RoundHeaderProps) => {
    const isActive = Boolean(roundEndTime);
    const endsAt = isActive ? dayjs(roundEndTime + "Z") : undefined;
    const startsAt = endsAt && endsAt.subtract(40, "minute");
    let subHeader = subText;

    const now = dayjs();
    const [shouldShowTimer, setShouldShowTimer] = useState<boolean>(
        Boolean(
            startsAt && endsAt && now.isAfter(startsAt) && now.isBefore(endsAt)
        )
    );

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
                        {headlineText ?? `Round ${roundIndex + 1}`}
                    </Text>
                    <Text size="sm" className="tracking-tight">
                        {subHeader}
                    </Text>
                </div>
            </div>
            {shouldShowTimer && (
                <VotePieMer
                    startTime={startsAt!.toDate()}
                    endTime={endsAt!.toDate()}
                    onEnd={() => setShouldShowTimer(false)}
                />
            )}
        </div>
    );
};

export default RoundHeader;
