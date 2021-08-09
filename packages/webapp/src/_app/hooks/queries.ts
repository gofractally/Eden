import { useQueries, useQuery, UseQueryResult } from "react-query";

import {
    EdenMember,
    getEdenMember,
    getMember,
    getMembers,
    getTreasuryStats,
    getNewMembers,
    getMembersStats,
    VoteDataQueryOptionsByGroup,
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
    getParticipantsInCompletedRound,
    getVoteData,
    getVoteDataRow,
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

export const queryMyDelegation = (memberAccount?: string) => ({
    queryKey: ["query_my_delegation", memberAccount],
    queryFn: () => getMyDelegation(memberAccount),
});

export const queryMemberGroupParticipants = (
    memberAccount?: string,
    config?: ActiveStateConfigType
) => ({
    queryKey: ["query_member_group_participants", memberAccount, config],
    queryFn: () => getMemberGroupParticipants(memberAccount, config),
});

export const queryVoteDataRow = (account?: string) => ({
    queryKey: ["query_vote_data_row", account],
    queryFn: () => {
        if (!account)
            throw new Error(
                "getVoteDataRow requires an account (got 'undefined')"
            );
        return getVoteDataRow({ fieldName: "member", fieldValue: account });
    },
});

export const queryVoteData = (options: VoteDataQueryOptionsByGroup = {}) => ({
    queryKey: ["query_vote_data"],
    queryFn: () => getVoteData(options),
});

export const queryParticipantsInCompletedRound = (
    electionRound?: number,
    member?: EdenMember
) => ({
    queryKey: ["query_current_election", electionRound, member],
    queryFn: () => {
        if (!electionRound || !member)
            throw new Error(
                "useParticipantsInCompletedRound() requires a value for 'memberAccount' and 'electionRound'"
            );
        return getParticipantsInCompletedRound(electionRound, member);
    },
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
    page: number = 1,
    pageSize: number = 200,
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

export const useMemberListByAccountNames = (
    accountNames: string[],
    enabled: boolean = true
) =>
    useQueries(
        accountNames.map((accountName) => ({
            ...queryMemberByAccountName(accountName),
            staleTime: Infinity,
            enabled: Boolean(accountName) && enabled,
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

export const useParticipantsInCompletedRound = (
    electionRound?: number,
    member?: EdenMember
) => {
    return useQuery({
        ...queryParticipantsInCompletedRound(electionRound, member),
        enabled: Boolean(electionRound && member),
    });
};

export const useCurrentElection = () =>
    useQuery({
        ...queryCurrentElection,
    });

export const useMemberGroupParticipants = (memberAccount?: string) => {
    const { data: currentElection } = useCurrentElection();
    return useQuery({
        ...queryMemberGroupParticipants(memberAccount, currentElection?.config),
        enabled: Boolean(memberAccount && currentElection?.config),
        refetchInterval: 10000,
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

export const useVoteDataRow = (account?: string) => {
    return useQuery({
        ...queryVoteDataRow(account),
        enabled: Boolean(account),
    });
};

export const useVoteData = (
    voteQueryConfig: VoteDataQueryOptionsByGroup,
    queryOptions = {}
) =>
    useQuery({
        ...queryVoteData(voteQueryConfig),
        ...queryOptions,
    });
