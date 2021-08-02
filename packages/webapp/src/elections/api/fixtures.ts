import { CurrentElection, ElectionState, VoteData } from "elections/interfaces";

// The following fixtures represent the following Election/round layout
// Round 1:
//  - Group1: egeon.edev, edenmember12, edenmember13 (voted up edenmember13)
//  - Group2: edenmember11, pip.edev (voted up edenmember11)
// Round 2 (assumes a full voting / non-sortition round just for the sake of minimal fixture data)
//  - Group1: edenmember11, edenmember13 (voted up edenmember11)
// Head Chief: edenmember11

export const fixtureElectionState: ElectionState = {
    lead_representative: "edenmember11",
    board: ["edenmember11", "edenmember13"],
    last_election_time: "2022-01-16T16:00:00.000",
};

// This data reflects an in-progress election round and, therefore,
// won't be consistent with other fixture data
// In the grand scheme of other fixture data,
// this would represent the Round 1 election, where there were 5 people in 2 groups
export const fixtureCurrentElection: CurrentElection = {
    electionState: "active",
    config: {
        num_participants: 5,
        num_groups: 2,
    },
    start_time: "2022-01-16T16:00:00.000",
    election_threshold: 1000,
};

// This data represents the *first* round (whereas other fixture data represents the *results* of the overall election)
export const fixtureVoteDataRows: VoteData[] = [
    {
        member: "egeon.edev",
        round: 1,
        index: 1,
        candidate: "edenmember13",
    },
    {
        member: "edenmember12",
        round: 1,
        index: 2,
        candidate: "edenmember13",
    },
    {
        member: "edenmember13",
        round: 1,
        index: 3,
        candidate: "edenmember13",
    },
    {
        member: "pip.edev",
        round: 1,
        index: 4,
        candidate: "edenmember11",
    },
    {
        member: "edenmember11",
        round: 1,
        index: 5,
        candidate: "edenmember11",
    },
];

export const fixtureVoteDataRow = (loggedInAccountName: string): VoteData =>
    fixtureVoteDataRows.find((row) => row.member === loggedInAccountName)!;
