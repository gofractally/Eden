import { Asset } from "_app";
import { MembersQueryNode, MemberSocialHandles } from "members/interfaces";

/******************************
 * NFT UI INTERFACES
 *****************************/
export interface MemberNFT {
    createdAt: number;
    account: string;
    name: string;
    image: string;
    attributions: string;
    bio: string;
    socialHandles: MemberSocialHandles;
    inductionVideo: string;
    templateId?: number;
    auctionData?: MemberNFTAuctionData;
    assetData?: MemberNFTAssetData;
    saleId?: string;
}

export interface MemberNFTAuctionData {
    auctionId: string;
    price: Asset;
    bidEndTime?: number;
}

export interface MemberNFTAssetData {
    assetId: string;
    templateMint: number;
}

/******************************
 * NFT API INTERFACES
 *****************************/

export interface TemplateData {
    template_id: string;
    immutable_data: EdenNftData;
    created_at_time: string;
}

export interface AssetData {
    asset_id: string;
    template_mint: string;
    template: TemplateData;
    sales: Array<{ sale_id: string }>;
}

export interface AuctionableTemplateData extends TemplateData {
    seller: string;
    auctionId: string;
    currentBid: Asset;
    endTime: number;
    assetId: string;
    templateMint: number;
}

interface EdenNftData {
    name: string;
    img: string;
    account: string;
    bio: string;
    video: string;
    attributions: string;
    social?: string;
}

/******************************
 * NFT GRAPHQL QUERY INTERFACES
 *****************************/
interface NFTCollectorsQueryNode {
    owner: MembersQueryNode;
}

export interface NFTCollectorsQuery {
    members: {
        edges: {
            node: {
                nfts: {
                    edges: {
                        node: NFTCollectorsQueryNode;
                    }[];
                };
            };
        }[];
    };
}
