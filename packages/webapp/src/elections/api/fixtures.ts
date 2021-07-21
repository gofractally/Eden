import { any } from "cypress/types/bluebird";
import { CurrentElection, ElectionState } from "elections/interfaces";

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
}; // representing pending state
