import { useQuery } from "react-query";

import { queryNewMembers, useMembers } from "_app";
import { MemberData } from "members";

const sortMembersByDateDESC = (a: MemberData, b: MemberData) =>
    b.createdAt - a.createdAt;

export const useMembersWithAssets = () => {
    const NEW_MEMBERS_PAGE_SIZE = 10000;
    const newMembers = useQuery({
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
