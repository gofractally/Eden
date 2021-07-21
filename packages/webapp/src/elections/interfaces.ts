export interface ElectionState {
    lead_representative: string;
    board: string[];
    last_election_time: string;
}

export interface CurrentElection {
    // TODO: make this a disjoint union of types
    // for state: pending
    // nothing

    // for state: registration
    start_time?: string;
    election_threshold?: number;

    // for states: seeding and final
    seed?: {
        current: string;
        start_time: string;
        end_time: string;
    };

    // for state: init_voters
    next_member_idx?: number;
    rng?: any; // also for state: post_round
    last_processed?: string;

    // for state: active
    round?: number;
    config?: {
        num_participants: number;
        num_groups: number;
    };
    saved_seed?: string;
    round_end?: string;

    // for state: post_round
    prev_round?: number;
    prev_config?: {
        num_participants: number;
        num_groups: number;
    };
    next_input_index?: number;
    next_output_index?: number;
}
