import React from "react";
import { Dayjs } from "dayjs";

import { election as electionEnvVars } from "config";
import {
    useCurrentMember,
    useMemberDataFromVoteData,
    useMemberGroupParticipants,
    useVoteData,
} from "_app/hooks/queries";
import { Container, Expander, Loader } from "_app/ui";
import { ErrorLoadingElection, useRoundStageTimes } from "elections";
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
    const meetingBreakDurationMs =
        (roundDurationMs - electionEnvVars.meetingDurationMs) / 2;

    const meetingStartTime = roundStartTime.add(meetingBreakDurationMs);
    const postMeetingStartTime = meetingStartTime.add(
        electionEnvVars.meetingDurationMs
    );

    const { stage, currentStageEndTime } = useRoundStageTimes(
        roundStartTime,
        roundEndTime,
        onRoundEnd
    );

    const isVotingOpen = [RoundStage.Meeting, RoundStage.PostMeeting].includes(
        stage
    );

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
