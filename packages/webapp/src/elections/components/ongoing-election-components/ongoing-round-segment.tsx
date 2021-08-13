import React, { useState } from "react";
import { useQueryClient } from "react-query";
import dayjs, { Dayjs } from "dayjs";
import { BiCheck } from "react-icons/bi";
import { RiVideoUploadLine } from "react-icons/ri";

import { electionMeetingDurationMs as meetingDurationMs } from "config";
import { useCountdown, useTimeout, useUALAccount } from "_app";
import {
    queryMemberGroupParticipants,
    useCurrentElection,
    useCurrentMember,
    useMemberDataFromVoteData,
    useMemberGroupParticipants,
    useVoteData,
} from "_app/hooks/queries";
import { Button, Container, Expander, Heading, Loader, Text } from "_app/ui";
import { MembersGrid } from "members";
import { MemberData } from "members/interfaces";
import { ElectionParticipantChip, VotePieMer } from "elections";
import {
    ActiveStateConfigType,
    ElectionStatus,
    RoundStage,
} from "elections/interfaces";

import Consensometer from "./consensometer";
import ErrorLoadingElection from "./error-loading-election";
import RoundHeader from "./round-header";
import { RequestElectionMeetingLinkButton } from "./request-election-meeting-link-button";
import VotingRoundParticipants from "./voting-round-participants";
import { setVote } from "../../transactions";

export interface RoundSegmentProps {
    electionState: string;
    roundIndex: number;
    roundStartTime: Dayjs;
    roundEndTime: Dayjs;
    roundDurationMs: number;
    electionConfig?: ActiveStateConfigType;
}

// TODO: Much of the building up of the data shouldn't be done in the UI layer. What do we want the API to provide? What data does this UI really need? We could even define a new OngoingElection type to provide to this UI.
export const OngoingRoundSegment = ({
    electionState,
    roundIndex,
    roundStartTime,
    roundEndTime,
    roundDurationMs,
    electionConfig,
}: RoundSegmentProps) => {
    const queryClient = useQueryClient();

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

    // TODO: Remove these logs
    console.log(
        "===========TIME REMAINING==========",
        timeRemainingToNextStageMs
    );

    console.log("===========ROUND STAGE==========", stage);

    useTimeout(() => {
        setStage(stage + 1);
    }, timeRemainingToNextStageMs);

    const { isLoading: isLoadingCurrentElection } = useCurrentElection({
        enabled: stage === RoundStage.Complete,
        refetchInterval: 5000,
        refetchIntervalInBackground: true,
    });

    const [selectedMember, setSelected] = useState<MemberData | null>(null);
    const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);

    const [ualAccount] = useUALAccount();
    const {
        data: loggedInMember,
        isLoading: isLoadingCurrentMember,
        isError: isErrorCurrentMember,
    } = useCurrentMember();

    const {
        data: participants,
        isLoading: isLoadingParticipants,
        isError: isErrorParticipants,
    } = useMemberGroupParticipants(loggedInMember?.account, {
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
        isLoadingCurrentElection ||
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
        members?.length !== voteData?.length;

    if (isError || !members || !voteData) {
        return <ErrorLoadingElection />;
    }

    const userVoterStats = voteData.find(
        (vs) => vs.member === loggedInMember?.account
    );

    const userVotingFor = members.find(
        (m) => m.account === userVoterStats?.candidate
    );

    const onSubmitVote = async () => {
        if (!selectedMember) return;
        setIsSubmittingVote(true);
        try {
            const authorizerAccount = ualAccount.accountName;
            const transaction = setVote(
                authorizerAccount,
                roundIndex,
                selectedMember?.account
            );
            await ualAccount.signTransaction(transaction, {
                broadcast: true,
            });

            // invalidate current member query to update participating status
            await new Promise((resolve) => setTimeout(resolve, 3000));
            queryClient.invalidateQueries(
                queryMemberGroupParticipants(
                    loggedInMember?.account,
                    electionConfig
                ).queryKey
            );
        } catch (error) {
            // TODO: Alert of failure...e.g., vote comes in after voting closes.
            console.error(error);
        }
        setIsSubmittingVote(false);
    };

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
            <Container className="space-y-2">
                {[RoundStage.PreMeeting, RoundStage.Meeting].includes(
                    stage
                ) && <RequestElectionMeetingLinkButton />}
                <Heading size={3}>Meeting group members</Heading>
                <Text>
                    {stage === RoundStage.PreMeeting
                        ? "Make sure you have your meeting link ready and stand by. You'll be on a video call with the following Eden members momentarily."
                        : stage === RoundStage.Meeting
                        ? "Meet with your group. Align on a leader >2/3 majority. Select your leader and submit your vote below."
                        : stage === RoundStage.Complete
                        ? "If you're the delegate, stand by. The next round will start momentarily."
                        : "This round is finalizing. Please submit any outstanding votes now. You will be able to come back later to upload election videos if your video isn't ready yet."}
                </Text>
            </Container>
            {isVotingOpen ? (
                <>
                    <Container className="flex justify-between">
                        <Heading size={4} className="inline-block">
                            Consensus
                        </Heading>
                        <Consensometer voteData={voteData} />
                    </Container>
                    <VotingRoundParticipants
                        members={members}
                        voteData={voteData}
                        selectedMember={selectedMember}
                        onSelectMember={(m) => setSelected(m)}
                    />
                    <Container>
                        <div className="flex flex-col xs:flex-row justify-center space-y-2 xs:space-y-0 xs:space-x-2">
                            <Button
                                size="sm"
                                disabled={
                                    !selectedMember ||
                                    isSubmittingVote ||
                                    userVotingFor?.account ===
                                        selectedMember.account
                                }
                                onClick={onSubmitVote}
                                isLoading={isSubmittingVote}
                            >
                                {!isSubmittingVote && (
                                    <BiCheck size={21} className="-mt-1 mr-1" />
                                )}
                                {userVotingFor ? "Change Vote" : "Submit Vote"}
                            </Button>
                            <Button size="sm">
                                <RiVideoUploadLine size={18} className="mr-2" />
                                Upload round {roundIndex + 1} recording
                            </Button>
                        </div>
                    </Container>
                </>
            ) : (
                <MembersGrid members={members}>
                    {(member) => (
                        <ElectionParticipantChip
                            key={`round-${roundIndex + 1}-participant-${
                                member.account
                            }`}
                            member={member}
                        />
                    )}
                </MembersGrid>
            )}
        </Expander>
    );
};

interface HeaderProps {
    stage: RoundStage;
    roundIndex: number;
    roundStartTime: Dayjs;
    roundEndTime: Dayjs;
    currentStageEndTime: Dayjs;
    meetingStartTime: Dayjs;
    postMeetingStartTime: Dayjs;
}

const Header = ({
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

interface HeadlineProps {
    roundIndex: number;
    stage: RoundStage;
    currentStageEndTime: Dayjs;
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
