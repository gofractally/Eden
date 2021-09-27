import { Query, useQuery } from "@edenos/common/dist/subchain";
import dayjs from "dayjs";
import { MemberAccountData } from "members";

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

export interface CurrentMemberElectionVotingDataQuery {
    electionTime: dayjs.Dayjs;
    votes: [
        {
            roundIndex: number;
            votingBegin: dayjs.Dayjs;
            votingEnd: dayjs.Dayjs;
            votingStarted: boolean;
            votingFinished: boolean;
            resultsAvailable: boolean;
            candidate?: MemberAccountData;
            winner?: MemberAccountData;
            video: string;
        }
    ];
}

export const useCurrentMemberElectionVotingData = (
    account?: string
): Query<CurrentMemberElectionVotingDataQuery> => {
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
                          }
                          winner {
                            account
                            profile {
                              name
                            }
                          }
                        }
                        candidate {
                          account
                          profile {
                            name
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
                lastElection.votes?.edges?.map((voteEdge: any) => ({
                    roundIndex: voteEdge.node.group.round.round,
                    votingBegin: dayjs(voteEdge.node.group.round.votingBegin),
                    votingEnd: dayjs(voteEdge.node.group.round.votingEnd),
                    votingStarted: voteEdge.node.group.round.votingStarted,
                    votingFinished: voteEdge.node.group.round.votingFinished,
                    resultsAvailable:
                        voteEdge.node.group.round.resultsAvailable,
                    candidate: voteEdge.node.candidate
                        ? {
                              account: voteEdge.node.candidate.account,
                              name: voteEdge.node.candidate.profile.name,
                          }
                        : undefined,
                    winner: voteEdge.node.group.winner
                        ? {
                              account: voteEdge.node.group.winner.account,
                              name: voteEdge.node.group.winner.profile.name,
                          }
                        : undefined,
                    video: voteEdge.node.video,
                })) || [];
        }
    }

    return query;
};
