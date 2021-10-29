import { QueryResult, useQuery } from "@edenos/common/dist/subchain";
import dayjs from "dayjs";

import { assetFromString } from "_app";
import {
    formatQueriedMemberData,
    MemberData,
    MEMBER_DATA_FRAGMENT,
} from "members";

export interface ElectionStatusQuery {
    status: {
        nextElection: string; // iso datetime string WITH timezone
        electionThreshold: number;
        numElectionParticipants: number;
    };
}

export const useElectionStatus = () =>
    useQuery<ElectionStatusQuery>(`
{
    status {
        nextElection
        electionThreshold
        numElectionParticipants
    }
}
`);

export interface RoundBasicQueryData {
    roundIndex: number;
    votingBegin: dayjs.Dayjs;
    votingEnd: dayjs.Dayjs;
    votingStarted: boolean;
    votingFinished: boolean;
    resultsAvailable: boolean;
    numGroups: number;
}

export interface RoundForUserVotingQueryData extends RoundBasicQueryData {
    candidate?: MemberData;
    winner?: MemberData;
    video: string;
}

export interface CurrentMemberElectionVotingDataQuery {
    electionTime: dayjs.Dayjs;
    votes: RoundForUserVotingQueryData[];
}

// TODO: Pass type arguments to useQuery within this file
export const useCurrentMemberElectionVotingData = (
    account?: string
): QueryResult<CurrentMemberElectionVotingDataQuery> => {
    const query = useQuery<any>(
        account
            ? `
    {
      members(le: "${account}", ge: "${account}") {
        edges {
          node {
            account
            elections(last: 1) {
              edges {
                node {
                  time
                  votes {
                    edges {
                      node {
                        group {
                          round {
                            round
                            votingBegin
                            votingEnd
                            votingStarted
                            votingFinished
                            resultsAvailable
                            numGroups
                          }
                          winner {
                            ${MEMBER_DATA_FRAGMENT}
                          }
                        }
                        candidate {
                          ${MEMBER_DATA_FRAGMENT}
                        }
                        video
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    `
            : ""
    );

    if (query.data) {
        const lastElection =
            query.data.members.edges?.[0]?.node.elections?.edges?.[0].node;
        if (lastElection) {
            query.data.electionTime = dayjs(lastElection.time);
            query.data.votes =
                lastElection.votes?.edges?.map(({ node: voteNode }: any) => ({
                    roundIndex: voteNode.group.round.round,
                    votingBegin: dayjs(voteNode.group.round.votingBegin),
                    votingEnd: dayjs(voteNode.group.round.votingEnd),
                    votingStarted: voteNode.group.round.votingStarted,
                    votingFinished: voteNode.group.round.votingFinished,
                    resultsAvailable: voteNode.group.round.resultsAvailable,
                    numGroups: voteNode.group.round.numGroups,
                    candidate: formatQueriedMemberData(voteNode.candidate),
                    winner: formatQueriedMemberData(voteNode.group.winner),
                    video: voteNode.video,
                })) || [];
        }
    }

    return query;
};

export interface VoteQueryData {
    voter: MemberData;
    candidate?: MemberData;
    video: string;
}

export interface RoundGroupQueryData {
    winner?: MemberData;
    votes: VoteQueryData[];
}

export interface RoundWithGroupQueryData extends RoundBasicQueryData {
    groups: RoundGroupQueryData[];
}

export interface ElectionGlobalQueryData {
    time: dayjs.Dayjs;
    rounds: RoundWithGroupQueryData[];
}

const currentElectionGlobalDataQuery = `
{
  elections(last: 1) {
    edges {
      node {
        time
        rounds {
          edges {
            node {
              round
              votingBegin
              votingEnd
              votingStarted
              votingFinished
              resultsAvailable
              numGroups
              groups {
                edges {
                  node {
                    winner {
                      ${MEMBER_DATA_FRAGMENT}
                    }
                    votes {
                      voter {
                        ${MEMBER_DATA_FRAGMENT}
                      }
                      candidate {
                        ${MEMBER_DATA_FRAGMENT}
                      }
                      video
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

export const useCurrentGlobalElectionData = (): QueryResult<ElectionGlobalQueryData> => {
    const query = useQuery<any>(currentElectionGlobalDataQuery);

    if (query.data) {
        const currentElection = query.data.elections.edges?.[0]?.node;
        if (currentElection) {
            query.data.time = dayjs(currentElection.time);
            query.data.rounds = mapQueriedRounds(currentElection.rounds?.edges);
        }
    }

    return query;
};

const mapQueriedRounds = (queriedRoundsEdges: any) =>
    queriedRoundsEdges?.map(({ node: roundNode }: any) => ({
        roundIndex: roundNode.round,
        votingBegin: dayjs(roundNode.votingBegin),
        votingEnd: dayjs(roundNode.votingEnd),
        votingStarted: roundNode.votingStarted,
        votingFinished: roundNode.votingFinished,
        resultsAvailable: roundNode.resultsAvailable,
        numGroups: roundNode.numGroups,
        groups: mapQueriedRoundsGroups(roundNode.groups?.edges),
    })) || [];

const mapQueriedRoundsGroups = (queriedRoundsGroupsEdges: any) =>
    queriedRoundsGroupsEdges?.map(({ node: groupNode }: any) => ({
        winner: formatQueriedMemberData(groupNode.winner),
        votes: mapQueriedGroupVotes(groupNode.votes),
    })) || [];

const mapQueriedGroupVotes = (votes: any) => {
    return (
        votes?.map((vote: any) => ({
            voter: formatQueriedMemberData(vote.voter),
            candidate: formatQueriedMemberData(vote.candidate),
            video: vote.video,
        })) || []
    );
};

export interface ScheduledDistributionTargetAmountQuery {
    distributions: {
        edges: [
            {
                node: {
                    time: string;
                    targetAmount: string;
                    started: boolean;
                };
            }
        ];
    };
}

export const useScheduledDistributionTargetAmount = () => {
    const edges = useQuery<ScheduledDistributionTargetAmountQuery>(`
      {
        distributions(last: 2) {
          edges {
            node {
              time
              targetAmount
              started
            }
          }
        }
      }`).data?.distributions.edges;
    if (!edges) return;
    edges.reverse();
    for (const edge of edges) {
        if (edge.node.started) break;
        if (edge.node.targetAmount !== null)
            return assetFromString(edge.node.targetAmount);
    }
};
