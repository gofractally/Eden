import { useQueries, useQuery, UseQueryResult } from "react-query";

import { EdenMember, getEdenMember, getMembersStats } from "members";
import { getIsCommunityActive } from "_app/api";

import { useUALAccount } from "../eos";

export const QUERY_MEMBER = "member";
export const QUERY_MEMBER_STATS = "query_member_stats";
export const QUERY_COMMUNITY_ACTIVE = "query_is_community_active";

export const useMemberByAccountName = (accountName: string) =>
    useQuery(
        [QUERY_MEMBER, accountName],
        async () => await getEdenMember(accountName),
        {
            staleTime: Infinity,
            enabled: Boolean(accountName),
        }
    );

export const useMemberListByAccountNames = (accountNames: string[]) =>
    useQueries(
        accountNames.map((accountName) => ({
            queryKey: [QUERY_MEMBER, accountName],
            queryFn: async () => await getEdenMember(accountName),
            staleTime: Infinity,
            enabled: Boolean(accountName),
        }))
    ) as UseQueryResult<EdenMember | undefined>[];

export const useCurrentMember = () => {
    const [ualAccount] = useUALAccount();
    return useMemberByAccountName(ualAccount?.accountName);
};

export const useIsCommunityActive = () =>
    useQuery(QUERY_COMMUNITY_ACTIVE, getIsCommunityActive, {
        refetchOnWindowFocus: false,
    });

export const membersStatsQuery = {
    queryKey: QUERY_MEMBER_STATS,
    queryFn: getMembersStats,
};
