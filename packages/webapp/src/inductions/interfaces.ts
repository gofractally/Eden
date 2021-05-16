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
    Inviter = "inviter",
    Endorser = "endorser",
    Invitee = "invitee",
    Member = "member", // use?
    NonMember = "non-member", // use?
    Unauthenticated = "unauthenticated",
    Unknown = "unknown",
}

export enum InductionStatus {
    invalid,
    expired,
    waitingForProfile,
    waitingForVideo,
    waitingForEndorsement,
}

export interface Endorsement {
    id: string;
    inviter: string;
    invitee: string;
    endorser: string;
    induction_id: string;
    endorsed: number;
}
