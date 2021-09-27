import React from "react";
import dayjs from "dayjs";

import { useCountdown } from "_app";
import { Text } from "_app/ui";
import { RoundStage } from "elections/interfaces";

import RoundHeader from "../round-header";
import { VotePieMer } from "./header-components";

interface HeaderProps {
    stage: RoundStage;
    roundIndex: number;
    roundStartTime: dayjs.Dayjs;
    roundEndTime: dayjs.Dayjs;
    currentStageEndTime: dayjs.Dayjs;
    meetingStartTime: dayjs.Dayjs;
    postMeetingStartTime: dayjs.Dayjs;
}

export const Header = ({
    stage,
    roundIndex,
    roundStartTime,
    roundEndTime,
    currentStageEndTime,
    meetingStartTime,
    postMeetingStartTime,
}: HeaderProps) => {
    return (
        <RoundHeader
            isRoundActive={stage !== RoundStage.Complete}
            headlineComponent={
                <RoundHeaderHeadline
                    roundIndex={roundIndex}
                    stage={stage}
                    currentStageEndTime={currentStageEndTime}
                />
            }
            sublineComponent={
                <Text size="sm" className="tracking-tight">
                    {roundStartTime.format("LT")} -{" "}
                    {roundEndTime.format("LT z")}
                </Text>
            }
        >
            {stage === RoundStage.Meeting && (
                <VotePieMer
                    startTime={meetingStartTime.toDate()}
                    endTime={postMeetingStartTime.toDate()}
                />
            )}
        </RoundHeader>
    );
};

export default Header;

interface HeadlineProps {
    roundIndex: number;
    stage: RoundStage;
    currentStageEndTime: dayjs.Dayjs;
}

const RoundHeaderHeadline = ({
    roundIndex,
    stage,
    currentStageEndTime,
}: HeadlineProps) => {
    const { hmmss } = useCountdown({ endTime: currentStageEndTime.toDate() });
    const roundNum = roundIndex + 1;
    switch (stage) {
        case RoundStage.PreMeeting:
            return (
                <Text size="sm" className="font-semibold">
                    Round {roundNum} starts in:{" "}
                    <span className="font-normal">{hmmss}</span>
                </Text>
            );
        case RoundStage.PostMeeting:
            return (
                <Text size="sm" className="font-semibold">
                    Round {roundNum} finalizes in:{" "}
                    <span className="font-normal">{hmmss}</span>
                </Text>
            );
        case RoundStage.Complete:
            return (
                <Text size="sm" className="font-semibold">
                    Round {roundIndex + 1} finalizing...
                </Text>
            );
    }
    return (
        <Text size="sm" className="font-semibold">
            Round {roundIndex + 1} in progress
        </Text>
    );
};
