import { EdenNftSocialHandles } from "nfts/interfaces";

export interface MemberData {
    templateId: number;
    name: string;
    image: string;
    edenAccount: string;
    bio: string;
    socialHandles: EdenNftSocialHandles;
    inductionVideo: string;
    createdAt: number;
}
