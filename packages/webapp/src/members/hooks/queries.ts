import { useQuery as useReactQuery } from "react-query";
import { useQuery as useBoxQuery } from "@edenos/common/dist/subchain";

import { queryNewMembers } from "_app";
import { MemberAccountData, MemberData } from "members";

const sortMembersByDateDESC = (a: MemberData, b: MemberData) =>
    b.createdAt - a.createdAt;

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
    node: MemberQueryNode;
}

interface MemberQueryNode {
    account: string;
    createdAt: string;
    profile: {
        name: string;
        img: string;
        social: string;
    };
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
                    }
                }
            }
        }
    }`);

    let formattedMembers: MemberAccountData[] = [];

    if (result.data) {
        const memberNodes = result.data.members.edges;
        if (memberNodes) {
            formattedMembers = memberNodes
                .map((member: MembersQueryEdge) =>
                    formatQueriedMemberAccountData(member.node)
                )
                .filter((member): member is MemberAccountData =>
                    Boolean(member)
                );
        }
    }

    return { ...result, data: formattedMembers };
};

// TODO: Should we break this out into a separate formatters file?
export const formatQueriedMemberAccountData = (
    memberAccountData: MemberQueryNode
): MemberAccountData | undefined => {
    if (!memberAccountData) return;
    return {
        account: memberAccountData.account,
        name: memberAccountData.profile.name,
        image: memberAccountData.profile.img,
        socialHandles: JSON.parse(memberAccountData.profile.social),
        createdAt: memberAccountData.createdAt
            ? new Date(memberAccountData.createdAt).getTime()
            : 0,
    };
};
