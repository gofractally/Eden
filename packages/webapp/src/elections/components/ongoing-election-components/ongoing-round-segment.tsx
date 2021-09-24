import React, { useEffect, useState } from "react";
import { useQueryClient } from "react-query";
import dayjs, { Dayjs } from "dayjs";
import { BiCheck } from "react-icons/bi";

import { electionMeetingDurationMs as meetingDurationMs } from "config";
import { onError, useCountdown, useTimeout, useUALAccount } from "_app";
import {
    queryMemberGroupParticipants,
    useCurrentMember,
    useMemberDataFromVoteData,
    useMemberGroupParticipants,
    useVoteData,
} from "_app/hooks/queries";
import { Button, Container, Expander, Heading, Loader, Text } from "_app/ui";
import { MemberData } from "members/interfaces";
import {
    ErrorLoadingElection,
    ElectionParticipantChip,
    VotePieMer,
} from "elections";
import {
    ActiveStateConfigType,
    Election,
    ElectionStatus,
    RoundStage,
    VoteData,
} from "elections/interfaces";

import Consensometer from "./consensometer";
import RoundHeader from "./round-header";
import { MeetingLink } from "./meeting-link";
import VotingRoundParticipants from "./voting-round-participants";
import { setVote } from "../../transactions";
import { VideoUploadButton } from "../video-upload-button";

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
                        <RoundParticipantsVotingPanel
                            members={members}
                            voteData={voteData}
                            roundIndex={roundIndex}
                            electionConfig={electionConfig}
                        />
                    ) : (
                        <RoundParticipantsWaitingPanel
                            members={members}
                            roundIndex={roundIndex}
                        />
                    )}
                </section>
            </div>
        </Expander>
    );
};

interface RoundInfoPanelProps {
    stage: RoundStage;
    roundIndex: number;
    meetingStartTime: dayjs.Dayjs;
    electionConfig?: ActiveStateConfigType;
    voteData?: VoteData[];
    isVotingOpen: boolean;
}

const RoundInfoPanel = ({
    stage,
    roundIndex,
    meetingStartTime,
    electionConfig,
    voteData,
    isVotingOpen,
}: RoundInfoPanelProps) => {
    return (
        <Container className="flex flex-col space-y-4">
            <section className="lg:order-3 lg:my-4 space-y-4">
                {[RoundStage.PreMeeting, RoundStage.Meeting].includes(
                    stage
                ) && (
                    <div>
                        <MeetingLink
                            stage={stage}
                            roundIndex={roundIndex}
                            meetingStartTime={meetingStartTime}
                            meetingDurationMs={meetingDurationMs}
                            electionConfig={electionConfig!}
                        />
                    </div>
                )}
                {[RoundStage.Meeting, RoundStage.PostMeeting].includes(
                    stage
                ) && (
                    <div className="hidden lg:block">
                        <VideoUploadButton buttonType="secondary" />
                    </div>
                )}
            </section>
            <section className="lg:order-1">
                <Heading size={3}>Meeting group members</Heading>
                <Text>
                    {stage === RoundStage.PreMeeting
                        ? "Make sure you have your meeting link ready and stand by. You'll be on a video call with the following Eden members momentarily."
                        : stage === RoundStage.Meeting
                        ? "Meet with your group. Align on a leader >2/3 majority. Select your leader and submit your vote below."
                        : stage === RoundStage.Complete
                        ? "If you're the delegate elect, stand by. The next round will start momentarily."
                        : "This round is finalizing. Please submit any outstanding votes now. You will be able to come back later to upload election videos if your video isn't ready yet."}
                </Text>
            </section>
            <section className="lg:order-2">
                {voteData && isVotingOpen && (
                    <Consensometer voteData={voteData} />
                )}
            </section>
        </Container>
    );
};

interface RoundParticipantsVotingPanelProps {
    members?: MemberData[];
    voteData: VoteData[];
    roundIndex: number;
    electionConfig?: ActiveStateConfigType;
}

const RoundParticipantsVotingPanel = ({
    members,
    voteData,
    roundIndex,
    electionConfig,
}: RoundParticipantsVotingPanelProps) => {
    const [selectedMember, setSelected] = useState<MemberData | null>(null);
    const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);

    const queryClient = useQueryClient();

    const [ualAccount] = useUALAccount();
    const { data: loggedInMember } = useCurrentMember();

    const userVoterStats = voteData!.find(
        (vs) => vs.member === loggedInMember?.account
    );

    const userVotingFor = members?.find(
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
                    roundIndex,
                    electionConfig
                ).queryKey
            );
        } catch (error) {
            console.error(error);
            onError(error as Error);
        }
        setIsSubmittingVote(false);
    };

    return (
        <>
            <VotingRoundParticipants
                members={members}
                voteData={voteData}
                selectedMember={selectedMember}
                onSelectMember={(m) => setSelected(m)}
                userVotingFor={userVotingFor?.account}
            />
            <Container>
                <div className="flex flex-col sm:flex-row justify-around items-center space-y-3 sm:space-y-0 md:px-16">
                    <div className="hidden sm:block lg:hidden">
                        <VideoUploadButton buttonType="link" />
                    </div>
                    <VoteButton
                        selectedMember={selectedMember}
                        isSubmittingVote={isSubmittingVote}
                        userVotingFor={userVotingFor}
                        onSubmitVote={onSubmitVote}
                    />
                    <div className="sm:hidden">
                        <VideoUploadButton buttonType="link" />
                    </div>
                </div>
            </Container>
        </>
    );
};

interface VoteButtonProps {
    selectedMember: MemberData | null;
    isSubmittingVote: boolean;
    userVotingFor?: MemberData;
    onSubmitVote: () => Promise<void>;
}

const VoteButton = ({
    selectedMember,
    isSubmittingVote,
    userVotingFor,
    onSubmitVote,
}: VoteButtonProps) => (
    <Button
        disabled={
            !selectedMember ||
            isSubmittingVote ||
            userVotingFor?.account === selectedMember.account
        }
        onClick={onSubmitVote}
        isLoading={isSubmittingVote}
    >
        {!isSubmittingVote && <BiCheck size={21} className="-mt-1 mr-1" />}
        {isSubmittingVote
            ? "Submitting vote"
            : userVotingFor
            ? "Change vote"
            : "Submit vote"}
    </Button>
);

interface RoundParticipantsWaitingPanelProps {
    members?: MemberData[];
    roundIndex: number;
}

const RoundParticipantsWaitingPanel = ({
    members,
    roundIndex,
}: RoundParticipantsWaitingPanelProps) => (
    <section className="grid grid-cols-1 gap-px">
        {members?.map((member) => (
            <ElectionParticipantChip
                key={`round-${roundIndex + 1}-participant-${member.account}`}
                member={member}
            />
        ))}
    </section>
);

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
