import { EdenNftSocialHandles, NftPrice } from "nfts/interfaces";

export interface MemberData {
    templateId: number;
    name: string;
    image: string;
    edenAccount: string;
    bio: string;
    socialHandles: EdenNftSocialHandles;
    inductionVideo: string;
    createdAt: number;
    salesData?: MemberSalesData;
}

export interface MemberSalesData {
    price: NftPrice;
    bidEndTime?: number;
}
