import { EdenNftSocialHandles } from "nfts/interfaces";
import { Asset, ElectionParticipationStatus, MemberStatus } from "_app";

export type VoteDataQueryOptionsByField = {
    fieldName?: string;
    fieldValue: string;
};

export interface MemberData {
    createdAt: number;
    account: string;
    name: string;
    image: string;
    attributions: string;
    bio: string;
    socialHandles: EdenNftSocialHandles;
    inductionVideo: string;
    templateId?: number;
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
    // Member's participation status is updated once they lose a round (updated as soon as a new value is known),
    // ie. a member's opt-in participation status lifetime is only from the start of Round 1
    // until the end of the Round they lose (or end of the election)
    election_participation_status: ElectionParticipationStatus;
    election_rank: number;
    // A member's representative field is set as soon as it is known. It is left at the old value until then.
    // For members who do participate (opted-in to the election), this is when a round that they do not win is processed.
    // For members who do not participate (opted-out of the election), it is during election setup, ie. when the first round groups are created.
    // Representative field is reset at start of first round for those who are opted out of the election (to zzzzzzzzzzzzj)
    representative: string;
}

export interface MemberStats {
    active_members: number;
    pending_members: number;
    completed_waiting_inductions: number;
    // NOTE: ranks is set to [] at start of election and has a new entry added at the end of each round
    ranks: any[];
}

/*********************************
 * MEMBER GRAPHQL QUERY INTERFACES
 ********************************/
export interface MembersQuery {
    members: {
        edges: {
            node: MembersQueryNode;
        }[];
    };
}

export interface MembersQueryNode {
    createdAt: string;
    account: string;
    profile: {
        name: string;
        img: string;
        attributions: string;
        social: string;
        bio: string;
    };
    inductionVideo: string;
}
