export interface NewMemberProfile {
    name: string;
    img: string;
    bio: string;
    social: string;
    attributions: string;
}

export interface Induction {
    id: string;
    inviter: string;
    invitee: string;
    endorsements: number;
    created_at: string;
    video: string;
    new_member_profile: NewMemberProfile;
}

export enum InductionRole {
    Inviter,
    Endorser,
    Invitee,
    Member,
    NonMember,
    Unauthenticated,
    Unknown,
}

export enum InductionStatus {
    Invalid,
    Expired,
    PendingProfile,
    PendingCeremonyVideo,
    PendingEndorsement,
    PendingDonation,
}

export interface Endorsement {
    id: string;
    inviter: string;
    invitee: string;
    endorser: string;
    induction_id: string;
    endorsed: number;
}
