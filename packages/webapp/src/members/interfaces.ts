import { EdenNftSocialHandles } from "nfts/interfaces";
import { Asset, ElectionParticipationStatus, MemberStatus } from "_app";

export type VoteDataQueryOptionsByField = {
    fieldName?: string;
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
    // NOTE: ranks is set to [] at start of election and has a new entry added at the end of each round
    ranks: any[];
}
