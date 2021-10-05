import {
    RoundBasicQueryData,
    RoundGroupQueryData,
    RoundWithGroupQueryData,
    SideNavLayout,
    useCountdown,
    useCurrentGlobalElectionData,
    VoteQueryData,
} from "_app";
import { Container, Heading, Loader, Expander, Text } from "_app/ui";

import {
    ErrorLoadingElection,
    RoundStage,
    useRoundStageTimes,
    VotingMemberChip,
} from "elections";
import { MemberData, MembersGrid } from "members";
import { RoundHeader } from "elections/components/ongoing-election-components";

export const ElectionStatsPage = () => {
    const {
        data: globalElectionData,
        isLoading: isLoading,
        isError: isError,
    } = useCurrentGlobalElectionData();

    if (isError || !globalElectionData) return <ErrorLoadingElection />;

    return (
        <SideNavLayout title="Election Stats">
            {isLoading ? (
                <Container>
                    <Loader />
                </Container>
            ) : (
                <div className="divide-y">
                    <Container>
                        <Heading size={1}>Election Stats</Heading>
                        {globalElectionData.rounds.map((round) => (
                            <RoundSegment
                                key={`election-round-${round.roundIndex}`}
                                round={round}
                            />
                        ))}
                    </Container>
                </div>
            )}
        </SideNavLayout>
    );
};

export default ElectionStatsPage;

interface RoundSegmentProps {
    round: RoundWithGroupQueryData;
}

const RoundSegment = ({ round }: RoundSegmentProps) => {
    return (
        <Expander header={<GlobalRoundHeader round={round} />}>
            {round.groups.map((group, i) => (
                <GroupSegment
                    key={`election-round-${round.roundIndex}-group-${i}`}
                    group={group}
                    groupIndex={i}
                    isFinished={round.votingFinished}
                />
            ))}
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
            votedFor: vote.candidate?.account,
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
    console.info(group);
    const groupLabel = group.winner?.name || (isFinished ? "No consensus" : "");

    return (
        <div className="w-full flex justify-between space-x-6 items-center">
            <div className="w-20">Group {groupIndex + 1}</div>
            <div className="flex-1">{groupLabel}</div>
        </div>
    );
};
