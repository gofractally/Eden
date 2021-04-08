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

export interface EdenTemplateData {
    template_id: string;
    immutable_data: EdenNftData;
    created_at_time: string;
}

export interface NftPrice {
    quantity: number;
    symbol: string;
    precision: number;
}

export interface AuctionableEdenTemplateData extends EdenTemplateData {
    currentBid: NftPrice;
    endTime: number;
}
