import { any } from "cypress/types/bluebird";
import { CurrentElection, ElectionState, VoteData } from "elections/interfaces";

export const fixtureElectionState: ElectionState = {
    lead_representative: "edenmember11",
    board: ["egeon.edev", "edenmember12", "edenmember13", "pip.edev"],
    last_election_time: "2022-01-16T16:00:00.000",
};

export const fixtureCurrentElection: CurrentElection = {
    electionState: "active",
    config: {
        num_participants: 5,
        num_groups: 2,
    },
    start_time: "2022-01-16T16:00:00.000",
    election_threshold: 1000,
};

export const fixtureMemberGroupParticipants: VoteData[] = [
    {
        member: "edenmember11",
        round: 1,
        index: 1,
        // who this member voted for in that round (this data only exists during the round)
        candidate: "edenmember11",
    },
    {
        member: "edenmember12",
        round: 1,
        index: 2,
        candidate: "edenmember11",
    },
    {
        member: "edenmember13",
        round: 1,
        index: 3,
        candidate: "edenmember11",
    },
    {
        member: "egeon.edev",
        round: 1,
        index: 4,
        candidate: "edenmember11",
    },
];
