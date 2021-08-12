import React, { useState } from "react";
import { useQueryClient } from "react-query";
import { Flipper, Flipped } from "react-flip-toolkit";
import { BiCheck } from "react-icons/bi";
import { RiVideoUploadLine } from "react-icons/ri";

import { useUALAccount } from "_app";
import {
    queryMemberGroupParticipants,
    useCurrentMember,
    useMemberDataFromVoteData,
    useMemberGroupParticipants,
    useVoteData,
} from "_app/hooks/queries";
import { Button, Container, Expander, Heading, Loader, Text } from "_app/ui";
import { VotingMemberChip } from "elections";
import { ActiveStateConfigType, ElectionStatus } from "elections/interfaces";
import { MembersGrid } from "members";
import { MemberData } from "members/interfaces";
import { setVote } from "../../transactions";

import Consensometer from "./consensometer";
import ErrorLoadingElection from "./error-loading-election";
import PasswordPromptModal from "./password-prompt-modal";
import RoundHeader from "./round-header";
import { RequestElectionMeetingLinkButton } from "./request-election-meeting-link-button";

export interface RoundSegmentProps {
    electionState: string;
    roundIndex: number;
    roundEndTime: string;
    electionConfig?: ActiveStateConfigType;
}

// TODO: Much of the building up of the data shouldn't be done in the UI layer. What do we want the API to provide? What data does this UI really need? We could even define a new OngoingElection type to provide to this UI.
export const OngoingRoundSegment = ({
    electionState,
    roundIndex,
    roundEndTime,
    electionConfig,
}: RoundSegmentProps) => {
    const queryClient = useQueryClient();

    const [selectedMember, setSelected] = useState<MemberData | null>(null);
    const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);
    const [
        showZoomLinkPermutations,
        setShowZoomLinkPermutations,
    ] = useState<boolean>(false); // TODO: Replace with real meeting link functionality
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
    } = useMemberGroupParticipants(loggedInMember?.account);

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
        members?.length !== voteData?.length;

    if (isError || !members || !voteData) {
        return <ErrorLoadingElection />;
    }

    const onSelectMember = (member: MemberData) => {
        if (member.account === selectedMember?.account) return;
        setSelected(member);
    };

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
            const signedTrx = await ualAccount.signTransaction(transaction, {
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

    const getVoteCountForMember = (member: MemberData) => {
        return voteData.filter((vd) => vd.candidate === member.account).length;
    };

    const sortMembersByVotes = [...members].sort(
        (a, b) => getVoteCountForMember(b) - getVoteCountForMember(a)
    );

    return (
        <Expander
            header={
                <RoundHeader
                    roundEndTime={roundEndTime}
                    roundIndex={roundIndex}
                />
            }
            startExpanded
            locked
        >
            <Container className="space-y-2">
                <Heading size={3}>Meeting group members</Heading>
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
            <Flipper flipKey={sortMembersByVotes}>
                <MembersGrid members={sortMembersByVotes}>
                    {(member, index) => {
                        const voteInfo = voteData.find(
                            (vd) => vd.member === member.account
                        );
                        const votesReceived = voteData.filter(
                            (vd) => vd.candidate === member.account
                        ).length;
                        const votingFor =
                            members.find(
                                (m) => m.account === voteInfo?.candidate
                            )?.name ?? voteInfo?.candidate;
                        return (
                            <Flipped
                                key={`leaderboard-${member.account}`}
                                flipId={`leaderboard-${member.account}`}
                            >
                                <VotingMemberChip
                                    member={member}
                                    isSelected={
                                        selectedMember?.account ===
                                        member.account
                                    }
                                    onSelect={() => onSelectMember(member)}
                                    votesReceived={votesReceived}
                                    votingFor={votingFor}
                                    electionVideoCid={
                                        loggedInMember?.account ===
                                        member.account
                                            ? "QmeKPeuSai8sbEfvbuVXzQUzYRsntL3KSj5Xok7eRiX5Fp/edenTest2ElectionRoom12.mp4"
                                            : undefined
                                    } // TODO: this will obviously change once implemented too
                                    className="bg-white"
                                    style={{
                                        zIndex: 10 + members.length - index,
                                    }}
                                />
                            </Flipped>
                        );
                    }}
                </MembersGrid>
            </Flipper>
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
