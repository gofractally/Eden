import { Asset } from "_app";

export interface EdenNftData {
    name: string;
    img: string;
    account: string;
    bio: string;
    video: string;
    attributions: string;
    social?: string;
}

export interface EdenNftSocialHandles {
    eosCommunity?: string;
    twitter?: string;
    linkedin?: string;
    telegram?: string;
    facebook?: string;
    blog?: string;
}

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
