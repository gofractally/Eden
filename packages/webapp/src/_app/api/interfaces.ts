export enum ElectionParticipationStatus { // Among other things, this corresponds to RSVP in the UI
    NoDonation = 0,
    InElection,
    NotInElection,
    RecentlyInducted,
}

// it needs to replicate our contract status, see /contracts/eden/include/members.hpp
export enum MemberStatus {
    PendingMembership = 0,
    ActiveMember,
}
