import { ipfsUrl } from "_app";
import { Member, MembersQueryNode } from "members/interfaces";
import { MemberNFT } from "nfts/interfaces";

/********************************************
 * MICROCHAIN GRAPHQL QUERY RESULT FORMATTERS
 *******************************************/

export const formatMembersQueryNodeAsMemberNFT = (
    data: MembersQueryNode
): MemberNFT | undefined => {
    if (!data) return;

    if (!data.profile) {
        console.info(`${data.account} has since resigned`);
    }

    return {
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : 0,
        account: data.account,
        name: data.profile?.name ?? data.account,
        image: data.profile?.img,
        attributions: data.profile?.attributions,
        bio: data.profile?.bio,
        socialHandles: data.profile ? JSON.parse(data.profile.social) : {},
        inductionVideo: data.inductionVideo,
    };
};

export const formatMembersQueryNodeAsMember = (
    data: MembersQueryNode
): Member | undefined => {
    if (!data) return;
    return {
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : 0,
        accountName: data.account,
        profile: {
            name: data.profile.name,
            image: {
                cid: data.profile.img,
                url: ipfsUrl(data.profile.img),
                attributions: data.profile.attributions,
            },
            bio: data.profile.bio,
            socialHandles: JSON.parse(data.profile.social),
        },
        inductionVideo: {
            cid: data.inductionVideo,
            url: ipfsUrl(data.inductionVideo),
        },
        encryptionKey: undefined, // Include once exposed
        participatingInElection: data.participating,
        delegateRank: undefined, // Include once exposed
        representativeAccountName: undefined, // Include once exposed
    };
};

// TODO: Remove after we transition everything we can to Member from MemberNFT
export const formatMemberAsMemberNFT = (member: Member): MemberNFT => ({
    createdAt: member.createdAt,
    account: member.accountName,
    name: member.profile.name,
    image: member.profile.image.cid,
    attributions: member.profile.image.attributions,
    bio: member.profile.bio,
    socialHandles: member.profile.socialHandles,
    inductionVideo: member.inductionVideo.cid,
});
