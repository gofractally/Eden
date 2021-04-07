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

export interface EdenNftCreationData {
    nft: EdenNftData;
    inductors: string[];
}
