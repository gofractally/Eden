export interface NewMemberProfile {
    name: string;
    img: string;
    bio: string;
    social: string;
}

export interface Induction {
    id: string;
    inviter: string;
    invitee: string;
    witnesses: string[];
    endorsements: string[];
    created_at: number;
    video: string;
    new_member_profile: NewMemberProfile;
}

export enum InductionStatus {
    invalid,
    waitingForProfile,
    waitingForVideo,
    waitingForEndorsement,
}

export interface Endorsement {
    inviter: string;
    invitee: string;
    endorser: string;
    induction_id: string;
    endorsed: boolean;
}
