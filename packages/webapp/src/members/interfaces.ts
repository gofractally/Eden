import { EdenNftSocialHandles } from "nfts/interfaces";
import { Asset } from "_app";

export interface MemberData {
    templateId: number;
    name: string;
    image: string;
    edenAccount: string;
    bio: string;
    socialHandles: EdenNftSocialHandles;
    inductionVideo: string;
    createdAt: number;
    salesData?: MemberSalesData;
}

export interface MemberSalesData {
    price: Asset;
    bidEndTime?: number;
}

// it needs to replicate our contract status, see /contracts/eden/include/members.hpp
export enum MemberStatus {
    PendingMembership = 0,
    ActiveMember = 1,
}

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
