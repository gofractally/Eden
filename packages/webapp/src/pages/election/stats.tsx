import React from "react";

import {
  RoundBasicQueryData,
  RoundGroupQueryData,
  RoundWithGroupQueryData,
  SideNavLayout,
  useCountdown,
  useCurrentGlobalElectionData
} from "_app";
import { Container, Heading, Loader, Expander, Text } from "_app/ui";
import {
  Avatars,
  DelegateChip,
  ErrorLoadingElection,
  RoundStage,
  useRoundStageTimes,
  VoteData,
  VotingMemberChip
} from "elections";
import { MembersGrid } from "members";
import { MemberNFT } from "nfts/interfaces";
import { RoundHeader } from "elections/components/ongoing-election-components";
import { ConsensometerBlocks } from "elections/components/ongoing-election-components/ongoing-round/round-info/consensometer";

export const ElectionStatsPage = () => {
  const {
    data: globalElectionData,
    isLoading: isLoading,
    isError: isError
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
                <Text>{globalElectionData.time.format("LL")}</Text>
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
    <Expander header={<GlobalRoundHeader round={round} />} showContentDivider>
      <div className="divide-y">
        {round.groups.map((group, i) => (
          <GroupSegment
            key={`election-round-${round.roundIndex}-group-${i}`}
            group={group}
            groupIndex={i}
            isFinished={round.votingFinished}
            isChiefDelegateGroup={round.numGroups === 1}
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

  const isChiefDelegateRound = round.numGroups === 1;
  const roundTitle = isChiefDelegateRound
    ? "Chief Delegates"
    : `Round ${roundNum}`;

  const roundStatusLabel = () => {
    if (isChiefDelegateRound) {
      return round.resultsAvailable ? "" : "elected";
    } else if (round.resultsAvailable) {
      return <>completed</>;
    }
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
            finalizes in: <span className="font-normal">{hmmss}</span>
          </>
        );
      case RoundStage.Complete:
        return <>completed</>;
      default:
        return <>in progress</>;
    }
  };

  const subText = `${round.votingBegin
    .utc()
    .format("LT")} - ${round.votingEnd.utc().format("LT")} UTC`;

  return (
    <RoundHeader
      isRoundActive={stage !== RoundStage.Complete}
      headlineComponent={
        <Text size="sm" className="font-semibold">
          {roundTitle} {roundStatusLabel()}
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
  isChiefDelegateGroup?: boolean;
}

interface GroupMembersStats {
  [key: string]: {
    receivedVotes: number;
    votedFor?: string;
    video?: string;
    isDelegate: boolean;
  };
}

const GroupSegment = ({
  group,
  groupIndex,
  isFinished,
  isChiefDelegateGroup
}: GroupSegmentProps) => {
  // TODO: revisit this, unfortunately the MembersGrid only accepts MemberData,
  // even though we don't need it to display the required summarized member
  // chip data
  const members: MemberNFT[] = group.votes.map((vote) => vote.voter);

  const membersStats = group.votes.reduce((membersVotingMap, vote) => {
    membersVotingMap[vote.voter.account] = {
      receivedVotes: 0,
      votedFor: vote.candidate?.name,
      video: vote.video,
      isDelegate: group.winner?.account === vote.voter.account
    };
    return membersVotingMap;
  }, {} as GroupMembersStats);

  group.votes
    .filter((vote) => vote.candidate)
    .forEach(
      (vote) => (membersStats[vote.candidate!.account].receivedVotes += 1)
    );

  return isChiefDelegateGroup ? (
    <ChiefDelegateGroup
      members={members}
      groupMembersStats={membersStats}
      isFinished={isFinished}
    />
  ) : (
    <RegularGroup
      header={
        <GroupHeader
          groupIndex={groupIndex}
          group={group}
          isFinished={isFinished}
        />
      }
      members={members}
      groupMembersStats={membersStats}
      isFinished={isFinished}
    />
  );
};

interface GroupProps {
  members: MemberNFT[];
  isFinished: boolean;
  groupMembersStats: GroupMembersStats;
  header?: React.ReactNode;
}

const RegularGroup = ({ members, groupMembersStats, header }: GroupProps) => {
  return (
    <Expander header={header} type="inactive">
      <MembersGrid members={members} maxCols={2}>
        {(member: MemberNFT) => {
          return (
            <VotingMemberChip
              key={`voting-member-${member.account}`}
              member={member}
              votesReceived={groupMembersStats[member.account].receivedVotes}
              electionVideoCid={groupMembersStats[member.account].video}
              votingFor={groupMembersStats[member.account].votedFor}
              isDelegate={groupMembersStats[member.account].isDelegate}
            />
          );
        }}
      </MembersGrid>
    </Expander>
  );
};

const ChiefDelegateGroup = ({
  members,
  groupMembersStats,
  isFinished
}: GroupProps) => {
  return (
    <MembersGrid members={members}>
      {(member: MemberNFT) => {
        const delegateTitle =
          isFinished && groupMembersStats[member.account].isDelegate
            ? "Head Chief"
            : "Chief Delegate";
        return (
          <DelegateChip
            key={`${member.account}-chief-delegate`}
            member={member}
            delegateTitle={delegateTitle}
            electionVideoCid={groupMembersStats[member.account].video}
          />
        );
      }}
    </MembersGrid>
  );
};

const GroupHeader = ({ group, groupIndex, isFinished }: GroupSegmentProps) => {
  const consensusData = group.votes.map((groupVotes) => ({
    member: groupVotes.voter.account,
    round: groupIndex,
    index: 0,
    candidate: groupVotes.candidate?.account
  })) as VoteData[];

  const groupLabel = group.winner?.name || (isFinished ? "[no consensus]" : "");

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
