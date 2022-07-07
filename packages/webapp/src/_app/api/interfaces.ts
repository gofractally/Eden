// replicates our contract election participation status, see /contracts/eden/include/members.hpp
export enum ElectionParticipationStatus {
    NotInElection = 0,
    NotInElection2 = 1,
    InElection = 2,
}

// it needs to replicate our contract status, see /contracts/eden/include/members.hpp
export enum MemberStatus {
    PendingMembership = 0,
    ActiveMember,
}
