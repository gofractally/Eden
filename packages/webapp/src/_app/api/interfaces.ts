import { EdenMember, MemberData } from "members";

// replicates our contract election participation status, see /contracts/eden/include/members.hpp
export enum ElectionParticipationStatus {
    NotInElection = 0,
    InElection,
}

// it needs to replicate our contract status, see /contracts/eden/include/members.hpp
export enum MemberStatus {
    PendingMembership = 0,
    ActiveMember,
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
    inProgressRoundIndex?: number; // undefined if no round (or election) in progress
    highestRoundIndexInWhichMemberWasRepresented?: number; // no ?
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
