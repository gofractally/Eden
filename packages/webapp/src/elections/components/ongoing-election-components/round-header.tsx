import { useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { FaCheckCircle } from "react-icons/fa";
import { GoSync } from "react-icons/go";

import { Text } from "_app/ui";
import { VotePieMer } from "elections";
import { RoundStage } from "elections/interfaces";

// TODO: Refactor this component. It's becoming unwieldy.
type RoundHeaderProps =
    | {
          roundStartTime: Dayjs;
          roundEndTime: Dayjs;
          roundStage?: RoundStage;
          meetingStartTime?: Dayjs;
          meetingEndTime?: Dayjs;
          roundIndex: number;
          subText?: string;
          headlineComponent?: React.ReactNode;
      }
    | {
          roundStartTime?: Dayjs;
          roundEndTime?: Dayjs;
          roundStage?: RoundStage;
          meetingStartTime?: Dayjs;
          meetingEndTime?: Dayjs;
          roundIndex: number;
          subText: string;
          headlineComponent?: React.ReactNode;
      };

export const RoundHeader = ({
    roundIndex,
    roundStage,
    roundStartTime,
    roundEndTime,
    meetingStartTime,
    meetingEndTime,
    subText,
    headlineComponent,
}: RoundHeaderProps) => {
    const now = dayjs();
    const isRoundActive = Boolean(
        roundStartTime &&
            roundEndTime &&
            now.isAfter(roundStartTime) &&
            now.isBefore(roundEndTime)
    );

    let subHeader = subText;

    const [shouldShowTimer, setShouldShowTimer] = useState<boolean>(
        roundStage === RoundStage.Meeting
    );

    if (!subText && roundStartTime && roundEndTime) {
        subHeader = `${roundStartTime.format("LT")} - ${roundEndTime.format(
            "LT z"
        )}`;
    }

    return (
        <div className="w-full flex justify-between">
            <div className="flex items-center space-x-2">
                {isRoundActive ? (
                    <GoSync size={24} className="text-gray-400" />
                ) : (
                    <FaCheckCircle size={22} className="ml-px text-gray-400" />
                )}
                <div>
                    {headlineComponent ?? (
                        <Text size="sm" className="font-semibold">
                            Round {roundIndex + 1}
                        </Text>
                    )}
                    <Text size="sm" className="tracking-tight">
                        {subHeader}
                    </Text>
                </div>
            </div>
            {shouldShowTimer && (
                <VotePieMer
                    startTime={meetingStartTime!.toDate()}
                    endTime={meetingEndTime!.toDate()}
                    onEnd={() => setShouldShowTimer(false)}
                />
            )}
        </div>
    );
};

export default RoundHeader;
