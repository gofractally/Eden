import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

import { electionMeetingDurationMs as meetingDurationMs } from "config";
import { useTimeout } from "_app";
import {
    useCurrentMember,
    useMemberDataFromVoteData,
    useMemberGroupParticipants,
    useVoteData,
} from "_app/hooks/queries";
import { Container, Expander, Loader } from "_app/ui";
import { ErrorLoadingElection } from "elections";
import {
    ActiveStateConfigType,
    Election,
    ElectionStatus,
    RoundStage,
} from "elections/interfaces";

import {
    Header,
    ParticipantsVotingPanel,
    ParticipantsWaitingPanel,
    RoundInfoPanel,
} from "./ongoing-round";

export interface RoundSegmentProps {
    ongoingElectionData?: Election;
    electionState: string;
    roundIndex: number;
    roundStartTime: Dayjs;
    roundEndTime: Dayjs;
    roundDurationMs: number;
    electionConfig?: ActiveStateConfigType;
    onRoundEnd: () => void;
}

// TODO: After first election, refactor to use new box election state engine.
export const OngoingRoundSegment = ({
    electionState,
    roundIndex,
    roundStartTime,
    roundEndTime,
    roundDurationMs,
    electionConfig,
    onRoundEnd,
}: RoundSegmentProps) => {
    // duration of time periods before and after election meeting call
    // stages: meeting prep -> meeting -> post-meeting finalization -> round end
    const meetingBreakDurationMs = (roundDurationMs - meetingDurationMs) / 2;

    const now = dayjs();

    const meetingStartTime = roundStartTime.add(meetingBreakDurationMs);
    const postMeetingStartTime = meetingStartTime.add(meetingDurationMs);

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

    const isVotingOpen = [RoundStage.Meeting, RoundStage.PostMeeting].includes(
        stage
    );

    useTimeout(() => {
        const nextStage = stage + 1;
        setStage(nextStage);
        if (nextStage === RoundStage.Complete) onRoundEnd();
    }, timeRemainingToNextStageMs);

    useEffect(() => {
        if (currentStage === RoundStage.Complete) {
            // if mounted after end of round but before results processed,
            // we call this to trigger polling for next state
            onRoundEnd();
        }
    }, []);

    const {
        data: loggedInMember,
        isLoading: isLoadingCurrentMember,
        isError: isErrorCurrentMember,
    } = useCurrentMember();

    const {
        data: participants,
        isLoading: isLoadingParticipants,
        isError: isErrorParticipants,
    } = useMemberGroupParticipants(loggedInMember?.account, roundIndex, {
        refetchInterval: isVotingOpen ? 10000 : null,
        refetchIntervalInBackground: true,
    });

    const {
        data: chiefs,
        isLoading: isLoadingChiefs,
        isError: isErrorChiefs,
    } = useVoteData(
        { limit: 20 },
        {
            enabled: electionState === ElectionStatus.Final,
        }
    );

    const voteData = participants ?? chiefs;
    const {
        data: members,
        isLoading: isLoadingMemberData,
        isError: isErrorMemberData,
    } = useMemberDataFromVoteData(voteData);

    const isLoading =
        isLoadingParticipants ||
        isLoadingChiefs ||
        isLoadingMemberData ||
        isLoadingCurrentMember;

    if (isLoading) {
        return (
            <Container>
                <Loader />
            </Container>
        );
    }

    const isError =
        isErrorParticipants ||
        isErrorChiefs ||
        isErrorMemberData ||
        isErrorCurrentMember ||
        (voteData &&
            voteData.length > 0 &&
            members?.length !== voteData?.length);

    if (isError) {
        return <ErrorLoadingElection />;
    }

    return (
        <Expander
            header={
                <Header
                    stage={stage}
                    roundIndex={roundIndex}
                    currentStageEndTime={currentStageEndTime}
                    roundStartTime={roundStartTime}
                    roundEndTime={roundEndTime}
                    meetingStartTime={meetingStartTime}
                    postMeetingStartTime={postMeetingStartTime}
                />
            }
            startExpanded
            locked
        >
            <div className="flex flex-col lg:flex-row-reverse">
                <section className="-mt-5 lg:flex-1">
                    <RoundInfoPanel
                        stage={stage}
                        roundIndex={roundIndex}
                        meetingStartTime={meetingStartTime}
                        electionConfig={electionConfig}
                        voteData={voteData}
                        isVotingOpen={isVotingOpen}
                    />
                </section>
                <section className="lg:flex-1">
                    {voteData && isVotingOpen ? (
                        <ParticipantsVotingPanel
                            members={members}
                            voteData={voteData}
                            roundIndex={roundIndex}
                            electionConfig={electionConfig}
                        />
                    ) : (
                        <ParticipantsWaitingPanel
                            members={members}
                            roundIndex={roundIndex}
                        />
                    )}
                </section>
            </div>
        </Expander>
    );
};
