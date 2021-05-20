import { useQueries, useQuery, UseQueryResult } from "react-query";

import { EdenMember, getEdenMember } from "members";
import { getIsCommunityActive } from "_app/api";

import { useUALAccount } from "../eos";
import { getInductionWithEndorsements } from "inductions/api";

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

export const useIsCommunityActive = () =>
    useQuery("isCommunityActive", getIsCommunityActive, {
        refetchOnWindowFocus: false,
    });

export const useGetInductionWithEndorsements = (inductionId: string) =>
    useQuery(["induction", inductionId], getInductionWithEndorsements, {
        // gets rid of bugs cause by refetching right after anchor/scatter signing
        refetchOnWindowFocus: false,
    });
