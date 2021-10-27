import { useQuery as useReactQuery } from "react-query";
import { useQuery as useBoxQuery } from "@edenos/common/dist/subchain";

import { getNewMembers, MemberAccountData, MemberData } from "members";

const sortMembersByDateDESC = (a: MemberData, b: MemberData) =>
    b.createdAt - a.createdAt;

export const queryNewMembers = (page: number, pageSize: number) => ({
    queryKey: ["query_new_members", page, pageSize],
    queryFn: () => getNewMembers(page, pageSize),
});

export const useMembersWithAssets = () => {
    const NEW_MEMBERS_PAGE_SIZE = 10000;
    const newMembers = useReactQuery({
        ...queryNewMembers(1, NEW_MEMBERS_PAGE_SIZE),
    });

    const allMembers = useMembers();

    const isLoading = newMembers.isLoading || allMembers.isLoading;
    const isError =
        newMembers.isError || allMembers.isError || !allMembers.data;

    let members: MemberData[] = [];

    if (allMembers.data.length) {
        const mergeAuctionData = (member: MemberData) => {
            const newMemberRecord = newMembers.data?.find(
                (newMember) => newMember.account === member.account
            );
            return newMemberRecord ?? member;
        };

        members = (allMembers.data as MemberData[])
            .sort(sortMembersByDateDESC)
            .map(mergeAuctionData);
    }

    return {
        members,
        isLoading,
        isError,
    };
};

// TODO: Move to interfaces file? Seems these are tightly coupled to queries though. Maybe a separate query-interfaces.ts file? Or keep here?
interface MembersQuery {
    members: {
        edges: MembersQueryEdge[];
    };
}

interface MembersQueryEdge {
    node: MembersQueryNode;
}

export interface MembersQueryNode {
    account: string;
    createdAt: string;
    profile: {
        name: string;
        img: string;
        social: string;
        bio: string;
    };
    inductionVideo: string;
}

export const useMembers = () => {
    const result = useBoxQuery<MembersQuery>(`{
        members {
            edges {
                node {
                    account
                    createdAt
                    profile {
                        name
                        img
                        social
                        bio
                    }
                    inductionVideo
                }
            }
        }
    }`);

    let formattedMembers: MemberAccountData[] = [];

    if (!result.data) return { ...result, data: formattedMembers };

    const memberEdges = result.data.members.edges;
    if (memberEdges) {
        formattedMembers = memberEdges.map(
            (member) =>
                formatQueriedMemberAccountData(member.node) as MemberAccountData
        );
    }

    return { ...result, data: formattedMembers };
};

export const useMemberByAccountName = (account: string) => {
    const result = useBoxQuery<MembersQuery>(`{
        members(ge: "${account}", le: "${account}") {
            edges {
                node {
                    account
                    createdAt
                    profile {
                        name
                        img
                        social
                        bio
                    }
                    inductionVideo
                }
            }
        }
    }`);

    if (!result.data) return { ...result, data: null };

    const memberNode = result.data.members.edges[0]?.node;
    const member = formatQueriedMemberAccountData(memberNode) ?? null;
    return { ...result, data: member };
};

// TODO: Should we break this out into a separate formatters file?
export const formatQueriedMemberAccountData = (
    memberAccountData: MembersQueryNode
): MemberAccountData | undefined => {
    if (!memberAccountData) return;
    return {
        account: memberAccountData.account,
        name: memberAccountData.profile.name,
        image: memberAccountData.profile.img,
        socialHandles: JSON.parse(memberAccountData.profile.social),
        bio: memberAccountData.profile.bio,
        inductionVideo: memberAccountData.inductionVideo,
        createdAt: memberAccountData.createdAt
            ? new Date(memberAccountData.createdAt).getTime()
            : 0,
    };
};
