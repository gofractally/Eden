export interface MemberData {
    templateId: number;
    name: string;
    image: string;
    edenAccount: string;
    bio: string;
    socialHandles: MemberSocialHandles;
    inductionVideo: string;
    role: string; // TODO: convert to enum
    createdAt: number;
}

export interface MemberSocialHandles {
    twitter?: string;
    telegram?: string;
    eosCommunity?: string;
    blogUrl?: string;
}
