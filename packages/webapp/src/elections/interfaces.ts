import { EdenMember, MemberNFT } from "members";

const NUM_PARTICIPANTS_IN_SORTITION_ROUND = 1;
const MAX_PARTICIPANTS_IN_SORTITION_ROUND = 13;
export const CONFIG_SORTITION_ROUND_DEFAULTS = {
    num_participants: MAX_PARTICIPANTS_IN_SORTITION_ROUND,
    num_groups: NUM_PARTICIPANTS_IN_SORTITION_ROUND,
};
export interface ElectionState {
    lead_representative: string;
    board: string[];
    last_election_time: string;
}

export enum ElectionStatus {
    PendingDate = "current_election_state_pending_date",
    Registration = "current_election_state_registration",
    Seeding = "current_election_state_seeding",
    InitVoters = "current_election_state_init_voters",
    Active = "current_election_state_active",
    PostRound = "current_election_state_post_round",
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

export interface SimpleVoteData {
    member: string;
    candidate: string;
}

export interface VoteData extends SimpleVoteData {
    round: number;
    index: number;
}

export enum RoundStage {
    PreMeeting,
    Meeting,
    PostMeeting,
    Complete,
}

export interface ElectionCompletedRound {
    participants: EdenMember[]; // .length will be number of participants and empty if no round happened
    participantsMemberData?: MemberNFT[];
    didReachConsensus?: boolean;
    delegate?: EdenMember;
}

export interface Election {
    isElectionOngoing?: boolean;
    isMemberStillParticipating?: boolean;
    isMemberOptedOut?: boolean;
    inSortitionRound?: boolean;
    // .length === number of rounds that have completed (regardless of current member's participation)
    completedRounds: ElectionCompletedRound[];
    ongoingRound: {
        roundIndex?: number;
        participants: EdenMember[];
        participantsMemberData: MemberNFT[];
    };
}
