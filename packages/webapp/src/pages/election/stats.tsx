import React from "react";
import {
    RoundBasicQueryData,
    RoundGroupQueryData,
    RoundWithGroupQueryData,
    SideNavLayout,
    useCountdown,
    useCurrentGlobalElectionData,
} from "_app";
import { Container, Heading, Loader, Expander, Text } from "_app/ui";

import {
    Avatars,
    ErrorLoadingElection,
    RoundStage,
    useRoundStageTimes,
    VoteData,
    VotingMemberChip,
} from "elections";
import { MemberData, MembersGrid } from "members";
import {
    ConsensometerBlocks,
    RoundHeader,
} from "elections/components/ongoing-election-components";

export const ElectionStatsPage = () => {
    const {
        data: globalElectionData,
        isLoading: isLoading,
        isError: isError,
    } = useCurrentGlobalElectionData();

    return (
        <SideNavLayout title="Election Stats">
            <div className="divide-y">
                <Container>
                    <Heading size={1}>Election</Heading>
                </Container>
                {isLoading ? (
                    <Container>
                        <Loader />
                    </Container>
                ) : isError || !globalElectionData ? (
                    <ErrorLoadingElection />
                ) : (
                    <>
                        <Container darkBg className="flex flex-col sm:flex-row">
                            <div className="flex-1 flex flex-col justify-center">
                                <Heading size={2}>All results</Heading>
                                <Text>
                                    {globalElectionData.time.format("LL")}
                                </Text>
                            </div>
                            <Avatars showAll className="flex-1" />
                        </Container>
                        {globalElectionData.rounds.map((round) => (
                            <RoundSegment
                                key={`election-round-${round.roundIndex}`}
                                round={round}
                            />
                        ))}
                    </>
                )}
            </div>
        </SideNavLayout>
    );
};

export default ElectionStatsPage;

interface RoundSegmentProps {
    round: RoundWithGroupQueryData;
}

const RoundSegment = ({ round }: RoundSegmentProps) => {
    return (
        <Expander
            header={<GlobalRoundHeader round={round} />}
            showContentDivider
        >
            <div className="divide-y">
                {round.groups.map((group, i) => (
                    <GroupSegment
                        key={`election-round-${round.roundIndex}-group-${i}`}
                        group={group}
                        groupIndex={i}
                        isFinished={round.votingFinished}
                    />
                ))}
            </div>
        </Expander>
    );
};

interface GlobalRoundHeaderProps {
    round: RoundBasicQueryData;
}

const GlobalRoundHeader = ({ round }: GlobalRoundHeaderProps) => {
    const { stage, currentStageEndTime } = useRoundStageTimes(
        round.votingBegin,
        round.votingEnd
    );

    const { hmmss } = useCountdown({ endTime: currentStageEndTime.toDate() });
    const roundNum = round.roundIndex + 1;

    const roundStatusLabel = () => {
        switch (stage) {
            case RoundStage.PreMeeting:
                return (
                    <>
                        starts in: <span className="font-normal">{hmmss}</span>
                    </>
                );
            case RoundStage.PostMeeting:
                return (
                    <>
                        finalizes in:{" "}
                        <span className="font-normal">{hmmss}</span>
                    </>
                );
            case RoundStage.Complete:
                return <>completed</>;
            default:
                return <>in progress</>;
        }
    };

    const subText = `${round.votingBegin.format(
        "LT"
    )} - ${round.votingEnd.format("LT z")}`;

    return (
        <RoundHeader
            isRoundActive={stage !== RoundStage.Complete}
            headlineComponent={
                <Text size="sm" className="font-semibold">
                    Round {roundNum} {roundStatusLabel()}
                </Text>
            }
            sublineComponent={
                <Text size="sm" className="tracking-tight">
                    {subText}
                </Text>
            }
        />
    );
};

interface GroupSegmentProps {
    group: RoundGroupQueryData;
    groupIndex: number;
    isFinished: boolean;
}

const GroupSegment = ({ group, groupIndex, isFinished }: GroupSegmentProps) => {
    // TODO: revisit this, unfortunately the MembersGrid only accepts MemberData,
    // even though we don't need it to display the required summarized member
    // chip data
    const members: MemberData[] = group.votes.map(
        (vote) => vote.voter as MemberData
    );

    const membersVotes = group.votes.reduce((membersVotingMap, vote) => {
        membersVotingMap[vote.voter.account] = {
            receivedVotes: 0,
            votedFor: vote.candidate?.name,
        };
        return membersVotingMap;
    }, {} as { [key: string]: { receivedVotes: number; votedFor?: string } });

    group.votes
        .filter((vote) => vote.candidate)
        .forEach(
            (vote) => (membersVotes[vote.candidate!.account].receivedVotes += 1)
        );

    const getVideoVoteData = (member: MemberData) =>
        group.votes.find((vote) => vote.voter.account === member.account)
            ?.video;

    return (
        <Expander
            header={
                <GroupHeader
                    groupIndex={groupIndex}
                    group={group}
                    isFinished={isFinished}
                />
            }
            type="inactive"
        >
            <MembersGrid members={members}>
                {(member) => {
                    return (
                        <VotingMemberChip
                            key={`voting-member-${member.account}`}
                            member={member}
                            votesReceived={
                                membersVotes[member.account].receivedVotes
                            }
                            electionVideoCid={getVideoVoteData(member)}
                            votingFor={membersVotes[member.account].votedFor}
                            isDelegate={
                                member.account === group.winner?.account
                            }
                        />
                    );
                }}
            </MembersGrid>
        </Expander>
    );
};

const GroupHeader = ({ group, groupIndex, isFinished }: GroupSegmentProps) => {
    const consensusData = group.votes.map((groupVotes) => ({
        member: groupVotes.voter.account,
        round: groupIndex,
        index: 0,
        candidate: groupVotes.candidate?.account,
    })) as VoteData[];

    const groupLabel =
        group.winner?.name || (isFinished ? "[no consensus]" : "");

    return (
        <div className="flex w-full items-center pr-4 sm:pr-8">
            <Text className="w-20 xs:w-24 flex-grow sm:flex-grow-0">
                Group {groupIndex + 1}
            </Text>
            <div className="flex flex-1 flex-col sm:flex-row items-end sm:items-center justify-end sm:justify-between">
                <Text className="mb-1 sm:mb-0">{groupLabel}</Text>
                <ConsensometerBlocks voteData={consensusData} />
            </div>
        </div>
    );
};
