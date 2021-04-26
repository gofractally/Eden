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
    auctionData?: MemberAuctionData;
    assetData?: AssetData;
    saleId?: string;
}

export interface AssetData {
    assetId: string;
    templateMint: number;
}

export interface MemberAuctionData {
    auctionId: string;
    price: Asset;
    bidEndTime?: number;
}

// it needs to replicate our contract status, see /contracts/eden/include/members.hpp
export enum MemberStatus {
    PendingMembership = 0,
    ActiveMember = 1,
}

export interface EdenMember {
    account: string;
    status: MemberStatus;
    nft_template_id: number;
}
