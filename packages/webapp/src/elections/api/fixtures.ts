import {
    CurrentElection,
    ElectionState,
    ElectionStatus,
    VoteData,
} from "elections/interfaces";
import { MemberData } from "members";
import {
    getFixtureEdenMember,
    getFixtureMemberData,
} from "members/api/fixtures";

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

export const fixtureRegistrationElection: CurrentElection = {
    electionState: ElectionStatus.Registration,
    start_time: "2022-01-16T16:00:00.000",
    election_threshold: 100,
};

// This data reflects an in-progress election round and, therefore,
// won't be consistent with other fixture data
// In the grand scheme of other fixture data,
// this would represent the Round 1 election, where there were 5 people in 2 groups
export const fixtureCurrentElection: CurrentElection = {
    electionState: ElectionStatus.Active,
    config: {
        num_participants: 13,
        num_groups: 7,
    },
    round: 3,
    saved_seed: "some seed",
    round_end: "2021-08-18T18:34:45.000",
};

// This data represents the *in-progress*, *first* round (whereas other fixture data represents the *results* of the overall election)
export const fixtureVoteDataRows: VoteData[] = [
    {
        member: "edenmember12",
        round: 1,
        index: 0,
        candidate: "jshdkflshkdjf",
    },
    // {
    //     member: "edenmember12",
    //     round: 1,
    //     index: 1,
    //     candidate: "edenmember12",
    // },
    // {
    //     member: "edenmember13",
    //     round: 1,
    //     index: 2,
    //     candidate: "edenmember14",
    // },
    // {
    //     member: "edenmember14",
    //     round: 1,
    //     index: 3,
    //     candidate: "edenmember14",
    // },
    // {
    //     member: "edenmember15",
    //     round: 1,
    //     index: 4,
    //     candidate: "egeon.edev",
    // },
    {
        member: "egeon.edev",
        round: 2,
        index: 4,
        candidate: "alice.edev",
    },
    // {
    //     member: "edenmember21",
    //     round: 1,
    //     index: 6,
    //     candidate: "pip.edev",
    // },
    // {
    //     member: "pip.edev",
    //     round: 1,
    //     index: 7,
    //     candidate: "pip.edev",
    // },
    {
        member: "edenmember25",
        round: 2,
        index: 8,
        candidate: "edenmember25",
    },
    {
        member: "alice.edev",
        round: 4,
        index: 5,
        candidate: "alice.edev",
    },
];

export const fixtureCompletedRounds = [
    {
        participants: [
            getFixtureEdenMember("edenmember22"),
            getFixtureEdenMember("alice.edev"),
        ], // .length will be number of participants and empty if no round happened
        participantsMemberData: [
            getFixtureMemberData("edenmember22"),
            getFixtureMemberData("alice.edev"),
        ],
        didReachConsensus: true,
        // delegate: undefined,
    },
    {
        participants: [
            getFixtureEdenMember("edenmember14"),
            getFixtureEdenMember("alice.edev"),
        ], // .length will be number of participants and empty if no round happened
        participantsMemberData: [
            getFixtureMemberData("edenmember14"),
            getFixtureMemberData("alice.edev"),
        ],
        didReachConsensus: true,
        // delegate: undefined,
    },
    {
        participants: [
            getFixtureEdenMember("egeon.edev"),
            getFixtureMemberData("alice.edev"),
        ], // .length will be number of participants and empty if no round happened
        participantsMemberData: [
            getFixtureMemberData("egeon.edev"),
            getFixtureMemberData("alice.edev"),
        ],
        didReachConsensus: true,
        // delegate: undefined,
    },
];
export const fixtureOngoingRound = (votingMemberData: MemberData[]) => ({
    // participants: [],
    // participantsMemberData: [],
    // participants: membersInOngoingRound,
    participantsMemberData: votingMemberData,
});

export const fixtureVoteDataRow = (loggedInAccountName: string): VoteData =>
    fixtureVoteDataRows.find((row) => row.member === loggedInAccountName)!;
