import { EdenNftSocialHandles } from "nfts/interfaces";
import { Asset } from "_app";

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
    price: Asset;
    bidEndTime?: number;
}
