import { CurrentElection, ElectionState } from "elections/interfaces";

export const fixtureElectionState: ElectionState = {
    lead_representative: "edenmember11",
    board: ["egeon.edev", "edenmember12", "edenmember13", "pip.edev"],
    last_election_time: "2022-01-16T16:00:00.000",
};

export const fixtureCurrentElection: CurrentElection = {}; // representing pending state
