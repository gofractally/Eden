import { ipfsUrl } from "_app";
import { Member, MemberData, MembersQueryNode } from "members/interfaces";

/********************************************
 * MICROCHAIN GRAPHQL QUERY RESULT FORMATTERS
 *******************************************/

export const formatQueriedMemberData = (
    data: MembersQueryNode
): MemberData | undefined => {
    if (!data) return;
    return {
        createdAt: data.createdAt ? new Date(data.createdAt).getTime() : 0,
        account: data.account,
        name: data.profile.name,
        image: data.profile.img,
        attributions: data.profile.attributions,
        bio: data.profile.bio,
        socialHandles: JSON.parse(data.profile.social),
        inductionVideo: data.inductionVideo,
    };
};

export const formatQueriedMemberDataAsMember = (
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
        participatingInNextElection: data.participating,
        delegateRank: undefined, // Include once exposed
        representativeAccountName: undefined, // Include once exposed
    };
};
