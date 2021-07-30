import { useQueries, useQuery, UseQueryResult } from "react-query";

import {
    EdenMember,
    getEdenMember,
    getMember,
    getMembers,
    getTreasuryStats,
    getNewMembers,
    getMembersStats,
} from "members";
import { getIsCommunityActive } from "_app/api";

import { useUALAccount } from "../eos";
import {
    getCurrentInductions,
    getEndorsementsByInductionId,
    getInduction,
    getInductions,
    getInductionWithEndorsements,
} from "inductions/api";
import {
    getChiefDelegates,
    getHeadDelegate,
    getMyDelegation,
} from "delegates/api";
import {
    getCurrentElection,
    getElectionState,
    getMemberGroupParticipants,
} from "elections/api/eden-contract";
import { ActiveStateConfigType } from "elections/interfaces";

export const queryHeadDelegate = {
    queryKey: "query_head_delegate",
    queryFn: getHeadDelegate,
};

export const queryChiefDelegates = {
    queryKey: "query_chief_delegates",
    queryFn: getChiefDelegates,
};

export const queryMyDelegation = (
    loggedInMemberAccount: string | undefined
) => ({
    queryKey: ["query_my_delegation", loggedInMemberAccount],
    queryFn: () => getMyDelegation(loggedInMemberAccount),
});

export const queryMemberGroupParticipants = (
    memberAccount: string | undefined,
    config: ActiveStateConfigType
) => ({
    queryKey: ["query_member_group_participants", memberAccount, config],
    queryFn: () => getMemberGroupParticipants(memberAccount, config),
});

export const queryCurrentElection = {
    queryKey: "query_current_election",
    queryFn: getCurrentElection,
};

export const queryMembersStats = {
    queryKey: "query_member_stats",
    queryFn: getMembersStats,
};

export const queryElectionState = {
    queryKey: "query_election_state",
    queryFn: getElectionState,
};

export const queryTreasuryStats = {
    queryKey: "query_treasury_stats",
    queryFn: getTreasuryStats,
};

export const queryIsCommunityActive = {
    queryKey: "query_is_community_active",
    queryFn: getIsCommunityActive,
};

export const queryMembers = (
    page: number,
    pageSize: number,
    nftTemplateIds: number[] = []
) => {
    const ids = nftTemplateIds.map((id) => id.toString());
    return {
        queryKey: ["query_members", page, pageSize, nftTemplateIds],
        queryFn: () => getMembers(page, pageSize, ids),
    };
};

export const queryNewMembers = (page: number, pageSize: number) => ({
    queryKey: ["query_new_members", page, pageSize],
    queryFn: () => getNewMembers(page, pageSize),
});

export const queryMemberByAccountName = (accountName: string) => ({
    queryKey: ["query_member", accountName],
    queryFn: () => getEdenMember(accountName),
});

export const queryMemberData = (account: string) => ({
    queryKey: ["query_member_data", account],
    queryFn: () => getMember(account),
});

export const queryInduction = (inductionId: string) => ({
    queryKey: ["query_induction", inductionId],
    queryFn: () => getInduction(inductionId),
});

export const queryInductions = (
    limit: number,
    lowerBound?: string,
    upperBound?: string
) => ({
    queryKey: ["query_inductions", lowerBound, upperBound, limit],
    queryFn: () => getInductions(lowerBound, upperBound, limit),
});

export const queryCurrentInductions = (
    account: string,
    isActiveMember: boolean
) => ({
    queryKey: ["query_current_inductions", account, isActiveMember],
    queryFn: () => getCurrentInductions(account, isActiveMember),
});

export const queryInductionWithEndorsements = (inductionId: string) => ({
    queryKey: ["query_induction_with_endorsements", inductionId],
    queryFn: () => getInductionWithEndorsements(inductionId),
});

export const queryEndorsementsByInductionId = (inductionId: string) => ({
    queryKey: ["query_endorsements_by_induction_id", inductionId],
    queryFn: () => getEndorsementsByInductionId(inductionId),
});

export const useMemberByAccountName = (accountName: string) =>
    useQuery({
        ...queryMemberByAccountName(accountName),
        staleTime: Infinity,
        enabled: Boolean(accountName),
    });

export const useMemberListByAccountNames = (accountNames: string[]) =>
    useQueries(
        accountNames.map((accountName) => ({
            ...queryMemberByAccountName(accountName),
            staleTime: Infinity,
            enabled: Boolean(accountName),
        }))
    ) as UseQueryResult<EdenMember | undefined>[];

export const useCurrentMember = () => {
    const [ualAccount] = useUALAccount();
    return useMemberByAccountName(ualAccount?.accountName);
};

export const useIsCommunityActive = () =>
    useQuery({
        ...queryIsCommunityActive,
        refetchOnWindowFocus: false,
    });

export const useMyDelegation = () => {
    const { data: member } = useCurrentMember();
    return useQuery({
        ...queryMyDelegation(member?.account),
        enabled: Boolean(member?.account),
    });
};

export const useChiefDelegates = () =>
    useQuery({
        ...queryChiefDelegates,
    });

export const useHeadDelegate = () =>
    useQuery({
        ...queryHeadDelegate,
    });

export const useCurrentElection = () =>
    useQuery({
        ...queryCurrentElection,
    });

export const useMemberGroupParticipants = (
    loggedInMemberAccount: string | undefined
) => {
    const { data: currentElection } = useCurrentElection();
    return useQuery({
        ...queryMemberGroupParticipants(
            loggedInMemberAccount,
            currentElection?.config
        ),
        enabled: Boolean(loggedInMemberAccount && currentElection?.config),
    });
};

export const useElectionState = () =>
    useQuery({
        ...queryElectionState,
    });

export const useMemberStats = () =>
    useQuery({
        ...queryMembersStats,
    });
