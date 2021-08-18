import { EdenMember, MemberData } from "members";

export interface ElectionState {
    lead_representative: string;
    board: string[];
    last_election_time: string;
}

export enum ElectionStatus {
    PendingDate = "current_election_state_pending_date",
    Registration = "current_election_state_registration",
    Seeding = "current_election_state_seeding",
    Voters = "current_election_state_init_voters",
    Active = "current_election_state_active",
    Round = "current_election_state_post_round",
    Final = "current_election_state_final",
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

// TODO: reconsider the TS error I was getting that forced me to export this. Preferably, we don't export it
export interface CurrentElection_activeState {
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

export enum RoundStage {
    PreMeeting,
    Meeting,
    PostMeeting,
    Complete,
}

interface ElectionCompletedRound {
    participants: EdenMember[]; // .length will be number of participants and empty if no round happened
    participantsMemberData: MemberData[];
    didReachConsensus?: boolean;
    delegate?: string;
}

export interface Election {
    member?: {
        memberRank?: number; // undefined if still participating
        isMemberRegisteredForElection?: boolean;
        isMemberStillParticipating?: boolean;
    };
    isElectionInProgress?: boolean;
    isMemberStillParticipating?: boolean;
    isGapInDelegation?: boolean;
    inProgressRoundIndex?: number; // undefined if no round (or election) in progress
    inSortitionRound?: boolean;
    areRoundsWithNoParticipation: boolean;
    // .length === number of rounds that have completed (regardless of current member's participation)
    completedRounds: ElectionCompletedRound[];
    ongoingRound: {
        participants: EdenMember[];
        participantsMemberData: MemberData[];
        projectedDelegate?: string;
        isSortitionRound?: boolean;
    };
}
