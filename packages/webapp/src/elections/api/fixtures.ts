import { CurrentElection, ElectionState, VoteData } from "elections/interfaces";

// The following fixtures represent the following Election/round layout
// Round 1:
//  - Group1: edenmember11, edenmember12, (voted up edenmember12)
//  - Group2: edenmember13, edenmember14 (voted up edenmember14)
//  - Group3: edenmember15, egeon.edev (voted up egeon.edev)
//  - Group4: edenmember21, pip.edev (voted up pip.edev)
//  - Group5: edenmember22, alice.edev (voted up alice.edev)
//  - Group6: edenmember23 (voted no one)
//  - Group7: edenmember24, edenmember25 (voted up edenmember25)
// Round 2 (D1s voted up) (assumes a full voting / non-sortition round just for the sake of minimal fixture data)
//  - Group1: edenmember12 (voted up no one)
//  - Group2: egeon.edev, pip.edev (voted up egeon.edev)
//  - Group3: edenmember14, alice.edev (voted up alice.edev)
//  - Group4: edenmember25 (voted up edenmember25)
// Round 3 (D2s voted up) (assumes a full voting / non-sortition round just for the sake of minimal fixture data)
//  - Group1: egeon.edev, alice.edev (voted up alice.edev)
//  - Group2: edenmember25 (voted up edenmember25)
// Round 4 (D3s voted up): Chiefs (assumes a full voting / non-sortition round just for the sake of minimal fixture data)
//  - Group1: alice.edev, edenmember25 (voted up alice.edev)
// Round 5 (D4s voted up): Head Chief: alice.edev

// Open Questions:
// edenmember22: they voted for who ultimately became the Head Chief. What whould their Delegation look like?

export const fixtureElectionState: ElectionState = {
    lead_representative: "alice.edev",
    board: ["edenmember25", "alice.edev"],
    last_election_time: "2021-01-16T16:00:00.000",
};

// This data reflects an in-progress election round and, therefore,
// won't be consistent with other fixture data
// In the grand scheme of other fixture data,
// this would represent the Round 1 election, where there were 5 people in 2 groups
export const fixtureCurrentElection: CurrentElection = {
    electionState: "active",
    config: {
        num_participants: 13,
        num_groups: 7,
    },
    round: 2,
    saved_seed: "some seed",
    round_end: "2021-08-04T18:34:45.000",
};

// This data represents the *in-progress*, *first* round (whereas other fixture data represents the *results* of the overall election)
export const fixtureVoteDataRows: VoteData[] = [
    {
        member: "edenmember11",
        round: 1,
        index: 0,
        candidate: "edenmember12",
    },
    {
        member: "edenmember12",
        round: 1,
        index: 1,
        candidate: "edenmember12",
    },
    {
        member: "edenmember13",
        round: 1,
        index: 2,
        candidate: "edenmember14",
    },
    {
        member: "edenmember14",
        round: 1,
        index: 3,
        candidate: "edenmember14",
    },
    {
        member: "edenmember15",
        round: 1,
        index: 4,
        candidate: "egeon.edev",
    },
    {
        member: "egeon.edev",
        round: 1,
        index: 5,
        candidate: "edenmember13",
    },
    {
        member: "edenmember21",
        round: 1,
        index: 6,
        candidate: "pip.edev",
    },
    {
        member: "pip.edev",
        round: 1,
        index: 7,
        candidate: "pip.edev",
    },
];

export const fixtureVoteDataRow = (loggedInAccountName: string): VoteData =>
    fixtureVoteDataRows.find((row) => row.member === loggedInAccountName)!;
