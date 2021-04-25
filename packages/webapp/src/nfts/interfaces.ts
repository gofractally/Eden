import { Asset } from "_app";

export interface EdenNftData {
    name: string;
    img: string;
    edenacc: string;
    bio: string;
    inductionvid: string;
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
}

export interface AuctionableTemplateData extends TemplateData {
    currentBid: Asset;
    endTime: number;
}
