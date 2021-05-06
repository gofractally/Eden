import { useQueries, useQuery, UseQueryResult } from "react-query";

import { EdenMember, getEdenMember } from "members";

import { useUALAccount } from "../eos";

export const useMemberByAccountName = (accountName: string) =>
    useQuery(
        ["member", accountName],
        async () => await getEdenMember(accountName),
        {
            staleTime: Infinity,
            enabled: Boolean(accountName),
        }
    );

export const useMemberListByAccountNames = (accountNames: string[]) =>
    useQueries(
        accountNames.map((accountName) => ({
            queryKey: ["member", accountName],
            queryFn: async () => await getEdenMember(accountName),
            staleTime: Infinity,
            enabled: Boolean(accountName),
        }))
    ) as UseQueryResult<EdenMember | undefined>[];

export const useCurrentMember = () => {
    const [ualAccount] = useUALAccount();
    return useMemberByAccountName(ualAccount?.accountName);
};
