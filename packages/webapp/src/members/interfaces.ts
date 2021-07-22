import { EdenNftSocialHandles } from "nfts/interfaces";
import { Asset, ElectionParticipationStatus, MemberStatus } from "_app";

export interface MemberData {
    templateId: number;
    name: string;
    image: string;
    account: string;
    bio: string;
    attributions: string;
    socialHandles: EdenNftSocialHandles;
    inductionVideo: string;
    status: number;
    election_participation_status: ElectionParticipationStatus;
    election_rank: number;
    representative: string;
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
}

export interface MemberStats {
    active_members: number;
    pending_members: number;
    completed_waiting_inductions: number;
    ranks: any[];
}
