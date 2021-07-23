import { CurrentElection, ElectionState, VoteData } from "elections/interfaces";

// The following fixtures represent the following Election/round layout
// Round 1:
//  - Group1: edenmember11, pip.edev (voted up edenmember11)
//  - Group2: egeon.edev, edenmember12, edenmember13 (voted up edenmember13)
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

// This data represents all members in a group.
// Because of how we've mocked/used these fixtures,
// this isn't raw data representing all members.
// This is, instead, the processed data showing a single group,
// namely, the group of 3 in round 1
export const fixtureMemberGroupParticipants: VoteData[] = [
    {
        member: "egeon.edev",
        round: 1,
        index: 3,
        candidate: "edenmember13",
    },
    {
        member: "edenmember12",
        round: 1,
        index: 4,
        candidate: "edenmember13",
    },
    {
        member: "edenmember13",
        round: 1,
        index: 5,
        candidate: "edenmember13",
    },
];
