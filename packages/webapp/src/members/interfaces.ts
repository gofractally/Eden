import { EdenNftSocialHandles } from "nfts/interfaces";
import { Asset, ElectionParticipationStatus, MemberStatus } from "_app";

export type VoteDataQueryOptionsByGroup = {
    index_position?: 2;
    lowerBound: number;
    upperBound: number;
};

export type VoteDataQueryOptionsByField = {
    fieldName?: "name";
    fieldValue: string;
};

export interface MemberData {
    templateId: number;
    name: string;
    image: string;
    account: string;
    bio: string;
    attributions: string;
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

export interface EdenMember {
    account: string;
    name: string;
    status: MemberStatus;
    nft_template_id: number;
    encryption_key?: string;
    election_participation_status: ElectionParticipationStatus;
    election_rank: number;
    representative: string;
}

export interface MemberStats {
    active_members: number;
    pending_members: number;
    completed_waiting_inductions: number;
    ranks: any[];
}
