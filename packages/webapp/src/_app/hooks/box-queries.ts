import {
    QueryResult,
    PagedQueryResult,
    PagedQuery,
    usePagedQuery,
    useQuery,
} from "@edenos/common/dist/subchain";
import dayjs from "dayjs";

import { assetFromString } from "_app";
import { MemberAccountData } from "members";

interface MemberQueryNode {
    node: {
        account: string;
        createdAt: string;
        profile: {
            name: string;
            img: string;
            social: string;
        };
    };
}
interface PagedMembersQuery {
    members: PagedQuery<MemberQueryNode>;
}

export const usePagedMembers = (
    pageSize: number = 20
): PagedQueryResult<MemberAccountData[]> => {
    const query = `{
    members(@page@) {
        pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
        }
        edges {
            node {
                account
                createdAt
                profile {
                    name
                    img
                    social
                }
            }
        }
    }
}
    `;

    const pagedResult = usePagedQuery<PagedMembersQuery>(
        query,
        pageSize,
        (result) => result.data?.members.pageInfo
    );

    let formattedMembers: MemberAccountData[] = [];

    if (pagedResult.result.data) {
        const memberNodes = pagedResult.result.data.members.edges;
        if (memberNodes) {
            formattedMembers = memberNodes
                .map((member: MemberQueryNode) =>
                    formatQueriedMemberAccountData(member.node)
                )
                .filter((member): member is MemberAccountData =>
                    Boolean(member)
                );
        }
    }

    return {
        ...pagedResult,
        result: { ...pagedResult.result, data: formattedMembers },
    };
};

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
    candidate?: MemberAccountData;
    winner?: MemberAccountData;
    video: string;
}

export interface CurrentMemberElectionVotingDataQuery {
    electionTime: dayjs.Dayjs;
    votes: RoundForUserVotingQueryData[];
}

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
                            account
                            profile {
                              name
                              img
                              social
                            }
                          }
                        }
                        candidate {
                          account
                          profile {
                            name
                            img
                            social
                          }
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
                    candidate: formatQueriedMemberAccountData(
                        voteNode.candidate
                    ),
                    winner: formatQueriedMemberAccountData(
                        voteNode.group.winner
                    ),
                    video: voteNode.video,
                })) || [];
        }
    }

    return query;
};

export interface VoteQueryData {
    voter: MemberAccountData;
    candidate?: MemberAccountData;
    video: string;
}

export interface RoundGroupQueryData {
    winner?: MemberAccountData;
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
                      account
                      profile {
                        name
                        img
                        social
                      }
                    }
                    votes {
                      voter {
                        account
                        profile {
                          name
                          img
                          social
                        }
                      }
                      candidate {
                        account
                        profile {
                          name
                          img
                          social
                        }
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
        winner: formatQueriedMemberAccountData(groupNode.winner),
        votes: mapQueriedGroupVotes(groupNode.votes),
    })) || [];

const mapQueriedGroupVotes = (votes: any) => {
    return (
        votes?.map((vote: any) => ({
            voter: formatQueriedMemberAccountData(vote.voter),
            candidate: formatQueriedMemberAccountData(vote.candidate),
            video: vote.video,
        })) || []
    );
};

const formatQueriedMemberAccountData = (
    memberAccountData: any
): MemberAccountData | undefined =>
    memberAccountData
        ? {
              account: memberAccountData.account,
              name: memberAccountData.profile.name,
              image: memberAccountData.profile.img,
              socialHandles: JSON.parse(memberAccountData.profile.social),
              createdAt: memberAccountData.createdAt
                  ? new Date(memberAccountData.createdAt).getTime()
                  : 0,
          }
        : undefined;

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
