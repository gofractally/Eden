export interface ElectionState {
    lead_representative: string;
    board: string[];
    last_election_time: string;
}

interface CurrentElection_registrationState {
    start_time: string;
    election_threshold?: number;
}

interface Seeder {
    current: string;
    start_time: string;
    end_time: string;
}

interface CurrentElection_seedingState {
    seed?: Seeder;
}

interface CurrentElection_finalState {
    seed?: Seeder;
}

interface CurrentElection_initVotersState {
    next_member_idx: number;
    rng: any;
    last_processed: string;
}
export interface ActiveStateConfigType {
    num_participants: number;
    num_groups: number;
}
interface CurrentElection_activeState {
    round: number;
    config: ActiveStateConfigType;
    saved_seed: string;
    round_end: string;
}

interface CurrentElection_postRoundState {
    // for state: post_round
    prev_round: number;
    prev_config: {
        num_participants: number;
        num_groups: number;
    };
    rng: any;
    next_input_index: number;
    next_output_index: number;
}

// for state: pending
interface CurrentElectionBase {
    electionState: string;
}

export type CurrentElection = CurrentElectionBase &
    (
        | CurrentElection_activeState
        | CurrentElection_initVotersState
        | CurrentElection_postRoundState
        | CurrentElection_registrationState
        | CurrentElection_seedingState
    );

export interface VoteData {
    member: string;
    round: number;
    index: number;
    candidate: string;
}
