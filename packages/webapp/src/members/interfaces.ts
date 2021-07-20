import { EdenNftSocialHandles } from "nfts/interfaces";
import { Asset } from "_app";

export interface MemberData {
    templateId: number;
    name: string;
    image: string;
    account: string;
    bio: string;
    attributions: string;
    socialHandles: EdenNftSocialHandles;
    inductionVideo: string;
    status?: number; // TODO: remove these question marks if possible
    election_participation_status?: number;
    election_rank?: number;
    representative?: string;
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
    name: string;
    status: MemberStatus;
    nft_template_id: number;
    election_rank?: number;
    representative?: string;
}

export interface MemberStats {
    active_members: number;
    pending_members: number;
    completed_waiting_inductions: number;
    ranks: any[];
}
