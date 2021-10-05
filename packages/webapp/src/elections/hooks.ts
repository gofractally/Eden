import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

import { useTimeout } from "_app";
import { election as electionEnvVars } from "config";

import { RoundStage } from "./interfaces";

export const useRoundStageTimes = (
    roundStartTime: Dayjs,
    roundEndTime: Dayjs,
    onRoundEnd?: () => void
) => {
    const roundDurationMs = roundEndTime.diff(roundStartTime);

    // duration of time periods before and after election meeting call
    // stages: meeting prep -> meeting -> post-meeting finalization -> round end
    const meetingBreakDurationMs =
        (roundDurationMs - electionEnvVars.meetingDurationMs) / 2;

    const now = dayjs();

    const meetingStartTime = roundStartTime.add(meetingBreakDurationMs);
    const postMeetingStartTime = meetingStartTime.add(
        electionEnvVars.meetingDurationMs
    );

    let currentStage = RoundStage.PreMeeting;
    let timeRemainingToNextStageMs: number | null = meetingStartTime.diff(now);
    let currentStageEndTime: Dayjs = meetingStartTime;

    if (now.isAfter(roundEndTime)) {
        currentStage = RoundStage.Complete;
        timeRemainingToNextStageMs = null;
        currentStageEndTime = roundEndTime;
    } else if (now.isAfter(postMeetingStartTime)) {
        currentStage = RoundStage.PostMeeting;
        timeRemainingToNextStageMs = roundEndTime.diff(now);
        currentStageEndTime = roundEndTime;
    } else if (now.isAfter(meetingStartTime)) {
        currentStage = RoundStage.Meeting;
        timeRemainingToNextStageMs = postMeetingStartTime.diff(now);
        currentStageEndTime = postMeetingStartTime;
    }

    const [stage, setStage] = useState<RoundStage>(currentStage);

    useTimeout(() => {
        const nextStage = stage + 1;
        setStage(nextStage);
        if (nextStage === RoundStage.Complete && onRoundEnd) onRoundEnd();
    }, timeRemainingToNextStageMs);

    useEffect(() => {
        if (currentStage === RoundStage.Complete && onRoundEnd) {
            // if mounted after end of round but before results processed,
            // we call this to trigger polling for next state
            onRoundEnd();
        }
    }, []);

    return { stage, currentStageEndTime };
};
