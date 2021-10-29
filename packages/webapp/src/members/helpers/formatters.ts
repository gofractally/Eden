import { MemberData, MembersQueryNode } from "members/interfaces";

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
