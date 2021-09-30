import {
    RoundBasicQueryData,
    RoundGroupQueryData,
    RoundWithGroupQueryData,
    SideNavLayout,
    useCurrentGlobalElectionData,
    VoteQueryData,
} from "_app";
import { Container, Heading, Loader, Expander, Text } from "_app/ui";

import {
    ElectionParticipantChip,
    ErrorLoadingElection,
    tallyVotesFromVoteData,
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
                />
            ))}
        </Expander>
    );
};

interface GlobalRoundHeaderProps {
    round: RoundBasicQueryData;
}

const GlobalRoundHeader = ({ round }: GlobalRoundHeaderProps) => {
    const isRoundActive = round.votingStarted && !round.votingFinished;
    const roundStatusLabel = isRoundActive
        ? "in progress"
        : round.votingFinished
        ? "completed"
        : "";
    const subText = `${round.votingBegin.format(
        "LT"
    )} - ${round.votingEnd.format("LT z")}`;
    return (
        <RoundHeader
            isRoundActive={isRoundActive}
            headlineComponent={
                <Text size="sm" className="font-semibold">
                    Round {round.roundIndex + 1} {roundStatusLabel}
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
}

const GroupSegment = ({ group, groupIndex }: GroupSegmentProps) => {
    // TODO: revisit this, unfortunately the MembersGrid only accepts MemberData,
    // even though we don't need it to display the required summarized member
    // chip data
    const members: MemberData[] = group.votes.map(
        (vote) => vote.voter as MemberData
    );
    const getVideoVoteData = (member: MemberData) =>
        ((member as unknown) as VoteQueryData).video;

    return (
        <Expander
            header={<GroupHeader groupIndex={groupIndex} group={group} />}
            type="inactive"
        >
            <MembersGrid members={members}>
                {(member, i) => {
                    return member.account === group.winner?.account ? (
                        <ElectionParticipantChip
                            key={`delegate-member-chip-${i}`}
                            member={member}
                            delegateLevel="Delegate"
                            electionVideoCid={getVideoVoteData(member)}
                        />
                    ) : (
                        <ElectionParticipantChip
                            key={`participant-member-chip-${i}`}
                            member={member}
                            electionVideoCid={getVideoVoteData(member)}
                        />
                    );
                }}
            </MembersGrid>
        </Expander>
    );
};

const GroupHeader = ({ group, groupIndex }: GroupSegmentProps) => {
    const groupVoteData = group.votes.map((data) => ({
        member: data.voter.account,
        candidate: data.candidate?.account || "",
    }));
    const { totalVotesCast, leadCandidates } = tallyVotesFromVoteData(
        groupVoteData
    );

    const leadCandidatesLabel = leadCandidates.length
        ? leadCandidates.join(", ")
        : "(None)";

    const winner = group.winner?.account || leadCandidatesLabel;

    return (
        <div className="w-full flex justify-between space-x-6 items-center">
            <div className="w-20">Group {groupIndex + 1}</div>
            <div className="w-8 p-2 text-lg text-center font-bold leading-none text-blue-100 transform bg-blue-600 rounded-full">
                {totalVotesCast}
            </div>
            <div className="flex-1">{winner}</div>
        </div>
    );
};
