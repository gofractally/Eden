import React, { useState } from "react";
import { useQueryClient } from "react-query";
import dayjs, { Dayjs } from "dayjs";
import { BiCheck } from "react-icons/bi";
import { RiVideoUploadLine } from "react-icons/ri";

import { electionMeetingDurationMs as meetingDurationMs } from "config";
import { useTimeout, useUALAccount } from "_app";
import {
    queryMemberGroupParticipants,
    useCurrentElection,
    useCurrentMember,
    useMemberDataFromVoteData,
    useMemberGroupParticipants,
    useVoteData,
} from "_app/hooks/queries";
import { Button, Container, Expander, Heading, Loader, Text } from "_app/ui";
import { ActiveStateConfigType, ElectionStatus } from "elections/interfaces";
import { MemberData } from "members/interfaces";
import { setVote } from "../../transactions";

import Consensometer from "./consensometer";
import ErrorLoadingElection from "./error-loading-election";
import PasswordPromptModal from "./password-prompt-modal";
import RoundHeader from "./round-header";
import { RequestElectionMeetingLinkButton } from "./request-election-meeting-link-button";
import VotingRoundParticipants from "./voting-round-participants";

enum RoundStage {
    PreMeeting,
    Meeting,
    PostMeeting,
    Complete,
}

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

    const preMeetingStartTime = roundStartTime;
    const meetingStartTime = roundStartTime.add(meetingBreakDurationMs);
    const postMeetingStartTime = meetingStartTime.add(meetingDurationMs);

    let currentStage = RoundStage.PreMeeting;
    let timeRemainingToNextStageMs: number | null = meetingStartTime.diff(now);

    if (now.isAfter(roundEndTime)) {
        currentStage = RoundStage.Complete;
        timeRemainingToNextStageMs = null;
    } else if (now.isAfter(postMeetingStartTime)) {
        currentStage = RoundStage.PostMeeting;
        timeRemainingToNextStageMs = roundEndTime.diff(now);
    } else if (now.isAfter(meetingStartTime)) {
        currentStage = RoundStage.Meeting;
        timeRemainingToNextStageMs = postMeetingStartTime.diff(now);
    } else if (now.isAfter(preMeetingStartTime)) {
        currentStage = RoundStage.PreMeeting;
        timeRemainingToNextStageMs = meetingStartTime.diff(now);
    }

    const [stage, setStage] = useState<RoundStage>(currentStage);

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
    const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(
        false
    ); // TODO: Hook up to the real password prompt

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
        refetchInterval: [RoundStage.Meeting, RoundStage.PostMeeting].includes(
            stage
        )
            ? 10000
            : null,
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
                <RoundHeader
                    roundStartTime={roundStartTime}
                    roundEndTime={roundEndTime}
                    roundIndex={roundIndex}
                />
            }
            startExpanded
            locked
        >
            <Container className="space-y-2">
                <Heading size={3}>Meeting group members</Heading>
                <Text>Stage {stage}</Text>
                <Text>
                    Meet with your group. Align on a leader &gt;2/3 majority.
                    Select your leader and submit your vote below.
                </Text>
                <RequestElectionMeetingLinkButton />
            </Container>
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
                            userVotingFor?.account === selectedMember.account
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
            <PasswordPromptModal
                isOpen={showPasswordPrompt}
                close={() => setShowPasswordPrompt(false)}
            />
        </Expander>
    );
};
