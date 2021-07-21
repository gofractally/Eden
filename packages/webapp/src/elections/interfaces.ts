import { string } from "zod";

export interface ElectionState {
    lead_representative: string;
    board: string[];
    last_election_time: string;
}

interface CurrentElection_registationState {
    // for state: registration
    start_time?: string;
    election_threshold?: number;
}

interface CurrentElection_seedingState {
    // for states: seeding and final
    seed?: {
        current: string;
        start_time: string;
        end_time: string;
    };
}

interface CurrentElection_initVotersState {
    // for state: init_voters
    next_member_idx?: number;
    rng?: any; // also for state: post_round
    last_processed?: string;
}

interface CurrentElection_activeState {
    // for state: active
    round?: number;
    config?: {
        num_participants: number;
        num_groups: number;
    };
    saved_seed?: string;
    round_end?: string;
}

interface CurrentElection_postRoundState {
    // for state: post_round
    prev_round?: number;
    prev_config?: {
        num_participants: number;
        num_groups: number;
    };
    next_input_index?: number;
    next_output_index?: number;
}

// for state: pending
// nothing
interface CurrentElectionBase {
    electionState: string;
}

// TODO: make this a disjoint union of types
export type CurrentElection = CurrentElectionBase &
    (
        | CurrentElection_activeState
        | CurrentElection_initVotersState
        | CurrentElection_postRoundState
        | CurrentElection_registationState
        | CurrentElection_seedingState
    );

export interface VoteData {
    member: string;
    round: number;
    index: number;
    candidate: string;
}
