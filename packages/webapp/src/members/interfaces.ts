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
