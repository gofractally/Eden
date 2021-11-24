import { useQuery as useReactQuery } from "react-query";
import { useQuery as useBoxQuery } from "@edenos/eden-subchain-client/dist/ReactSubchain";

import {
    formatMembersQueryNodeAsMember,
    getNewMembers,
    formatMemberAsMemberNFT,
} from "members";
import { Member, MemberNFT, MembersQuery } from "members/interfaces";
import { useUALAccount } from "_app";

export const MEMBER_DATA_FRAGMENT = `
    createdAt
    account
    profile {
        name
        img
        attributions
        social
        bio
    }
    inductionVideo
    participating
`;

export const useMembers = () => {
    const result = useBoxQuery<MembersQuery>(`{
        members {
            edges {
                node {
                    ${MEMBER_DATA_FRAGMENT}
                }
            }
        }
    }`);

    let formattedMembers: Member[] = [];

    if (!result.data) return { ...result, data: formattedMembers };

    const memberEdges = result.data.members.edges;
    if (memberEdges) {
        formattedMembers = memberEdges.map(
            (member) => formatMembersQueryNodeAsMember(member.node) as Member
        );
    }

    return { ...result, data: formattedMembers };
};

export const useMemberByAccountName = (account: string) => {
    const result = useBoxQuery<MembersQuery>(`{
        members(ge: "${account}", le: "${account}") {
            edges {
                node {
                    ${MEMBER_DATA_FRAGMENT}
                }
            }
        }
    }`);

    if (!result.data) return { ...result, data: null };

    const memberNode = result.data.members.edges[0]?.node;
    const member = formatMembersQueryNodeAsMember(memberNode) ?? null;
    return { ...result, data: member };
};

export const useCurrentMember = () => {
    const [ualAccount] = useUALAccount();
    return useMemberByAccountName(ualAccount?.accountName);
};

export const useMembersByAccountNames = (
    accountNames: string[] | undefined = []
) => {
    const { data: allMembers, ...memberQueryMetaData } = useMembers();
    const members = allMembers.filter((member) =>
        accountNames.includes(member.accountName)
    );
    return { data: members, ...memberQueryMetaData };
};

const sortMembersByDateDESC = (a: Member, b: Member) =>
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

    if (!allMembers.data.length) {
        return { data: [], isLoading, isError };
    }

    const mergeAuctionData = (member: Member) => {
        const memberNFT = newMembers.data?.find(
            (newMember) => newMember.account === member.accountName
        );
        if (!memberNFT) return { member };
        return {
            member,
            nft: memberNFT,
        };
    };

    const data: { member: Member; nft?: MemberNFT }[] = allMembers.data
        .sort(sortMembersByDateDESC)
        .map(mergeAuctionData);

    return { data, isLoading, isError };
};

/********************************************************************************
 * TODO: Refactor the following away once reliant components use Member interface
 ********************************************************************************/

export const useMembersByAccountNamesAsMemberNFTs = (
    accountNames: string[] | undefined = []
) => {
    const query = useMembersByAccountNames(accountNames);
    const memberNFTs = query.data.map(formatMemberAsMemberNFT);
    return { ...query, data: memberNFTs };
};
