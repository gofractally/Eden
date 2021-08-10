import { useQueries, useQuery, UseQueryResult } from "react-query";

import {
    EdenMember,
    getEdenMember,
    getMember,
    getMembers,
    getTreasuryStats,
    getNewMembers,
    getMembersStats,
    MemberData,
    VoteDataQueryOptionsByGroup,
} from "members";
import { getCommunityGlobals } from "_app/api";

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
    getOngoingElectionData,
    getParticipantsInCompletedRound,
    getVoteData,
    getVoteDataRow,
} from "elections/api/eden-contract";
import {
    ActiveStateConfigType,
    CurrentElection,
    CurrentElection_activeState,
    Election,
    VoteData,
} from "elections/interfaces";
import { EncryptionScope, getEncryptedData } from "encryption/api";
import { TableQueryOptions } from "_app/eos/interfaces";

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
    roundIndex?: number,
    config?: ActiveStateConfigType
) => ({
    queryKey: [
        "query_member_group_participants",
        memberAccount,
        roundIndex,
        config,
    ],
    queryFn: () =>
        getMemberGroupParticipants(memberAccount, roundIndex, config),
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

export const queryVoteData = (options: TableQueryOptions = {}) => ({
    queryKey: ["query_vote_data"],
    queryFn: () => getVoteData(options),
});

export const queryEncryptedData = (scope: EncryptionScope, id: string) => ({
    queryKey: ["query_encrypted_data"],
    queryFn: () => getEncryptedData(scope, id),
});

export const queryParticipantsInCompletedRound = (
    electionRound: number,
    member?: EdenMember,
    voteData?: VoteData
) => ({
    queryKey: [
        "query_participants_in_completed_round",
        member,
        voteData,
        electionRound,
    ],
    queryFn: () => {
        if (!member)
            throw new Error(
                "useParticipantsInCompletedRound() requires a value for 'memberAccount'"
            );
        return getParticipantsInCompletedRound(electionRound, member, voteData);
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

export const queryCommunityGlobals = {
    queryKey: "query_community_globals",
    queryFn: getCommunityGlobals,
};

export const queryOngoingElectionData = (
    votingMemberData?: MemberData[],
    currentElection?: CurrentElection,
    myDelegation?: EdenMember[],
    queryOptions: any = {}
) => ({
    queryKey: [
        "query_ongoing_round",
        votingMemberData,
        currentElection,
        myDelegation,
    ],
    queryFn: () => {
        return getOngoingElectionData(
            votingMemberData,
            currentElection,
            myDelegation
        );
    },
    // TODO: ensure adding this bad didn't break anything
    ...queryOptions,
});

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
    queryOptions: any = {}
) => {
    // use queryOptions.enabled unless unspecified, in which case, ensure we don't disable the internal `enabled`
    let enabled = "enabled" in queryOptions ? queryOptions.enabled : true;
    return useQueries(
        accountNames.map((accountName) => ({
            ...queryMemberByAccountName(accountName),
            staleTime: Infinity,
            ...queryOptions,
            // want this to fail if queryOpts.enabled is disabled and merge if enabled; ignore not specified
            enabled: enabled && accountNames.length && Boolean(accountName),
        }))
    ) as UseQueryResult<EdenMember | undefined>[];
};

export const useCurrentMember = () => {
    const [ualAccount] = useUALAccount();
    return useMemberByAccountName(ualAccount?.accountName);
};

export const useCommunityGlobals = () => {
    return useQuery({
        ...queryCommunityGlobals,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
    });
};

export const useIsCommunityActive = () => {
    const response = useCommunityGlobals();
    return {
        ...response,
        data: response.data ? response.data.stage > 0 : undefined,
    };
};

export const useMyDelegation = (queryOptions: any = {}) => {
    const { data: member } = useCurrentMember();
    // use queryOptions.enabled unless unspecified, in which case, ensure we don't disable the internal `enabled`
    let enabled = "enabled" in queryOptions ? queryOptions.enabled : true;

    return useQuery({
        ...queryMyDelegation(member?.account),
        enabled: enabled && Boolean(member?.account),
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

export const useParticipantsInMyCompletedRound = (electionRound: number) => {
    const { data: member } = useCurrentMember();
    const { data: voteData } = useVoteDataRow(member?.account);

    return useQuery({
        ...queryParticipantsInCompletedRound(electionRound, member, voteData),
        enabled: Boolean(member),
    });
};

export const useCurrentElection = (queryOptions: any = {}) =>
    useQuery<CurrentElection, Error>({
        ...queryCurrentElection,
        ...queryOptions,
    });

/**
 * use `votes` table data (for a particular person and round)
 * ASSUMPTION: this use method will only be called by *non*-Chief ongoing rounds
 * It relies on election state being active (not final)
 * @param {string} memberAccount - account of member to get
 * @param {number} roundIndex - election round index
 */
export const useMemberGroupParticipants = (
    memberAccount?: string,
    roundIndex?: number,
    queryOptions: any = {}
) => {
    const { data: currentElection } = useCurrentElection();
    const currentActiveElection = currentElection as CurrentElection_activeState;

    let enabled = Boolean(memberAccount) && roundIndex !== undefined;

    if ("enabled" in queryOptions) {
        enabled = enabled && queryOptions.enabled;
    }

    return useQuery<VoteData[], Error>({
        ...queryMemberGroupParticipants(
            memberAccount,
            roundIndex,
            currentActiveElection?.config
        ),
        ...queryOptions,
        enabled,
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
    voteQueryConfig: TableQueryOptions,
    queryOptions = {}
) =>
    useQuery({
        ...queryVoteData(voteQueryConfig),
        ...queryOptions,
    });

export const useMemberDataFromEdenMembers = (
    members?: EdenMember[],
    queryOptions: any = {}
) => {
    const nftTemplateIds = members?.map((em) => em.nft_template_id);

    let enabled = Boolean(nftTemplateIds?.length);
    if ("enabled" in queryOptions) {
        enabled = enabled && queryOptions.enabled;
    }

    return useQuery<MemberData[], Error>({
        ...queryMembers(1, nftTemplateIds?.length, nftTemplateIds),
        staleTime: Infinity,
        ...queryOptions,
        enabled,
    });
};

export const useMemberDataFromVoteData = (voteData?: VoteData[]) => {
    const responses = useMemberListByAccountNames(
        voteData?.map((participant) => participant.member) ?? []
    );
    const isFetchError = responses.some((res) => res.isError);
    const areQueriesComplete = responses.every((res) => res.isSuccess);
    const isLoading = responses.some((res) => res.isLoading);

    const edenMembers = responses
        .filter((res) => Boolean(res?.data?.nft_template_id))
        .map((res) => res.data as EdenMember);

    const memberDataRes = useMemberDataFromEdenMembers(edenMembers, {
        enabled: !isFetchError && areQueriesComplete,
    });

    return {
        ...memberDataRes,
        isLoading: memberDataRes.isLoading || isLoading,
        isError: memberDataRes.isError || isFetchError,
        isSuccess: memberDataRes.isSuccess || areQueriesComplete,
    };
};

export const useEncryptedData = (scope: EncryptionScope, id: string) =>
    useQuery({
        ...queryEncryptedData(scope, id),
        enabled: Boolean(id),
    });

export const useOngoingElectionData = (): UseQueryResult<
    Election | undefined
> => {
    const { data: loggedInMember } = useCurrentMember();
    const { data: memberStats } = useMemberStats();
    const { data: electionState } = useCurrentElection();
    const { data: myDelegation } = useMyDelegation();

    const { data: membersInOngoingRound } = useMemberGroupParticipants(
        loggedInMember?.account,
        memberStats?.ranks.length
    );
    let { data: votingMemberData } = useMemberDataFromVoteData(
        membersInOngoingRound
    );

    const { queryKey, queryFn } = queryOngoingElectionData(
        votingMemberData,
        electionState,
        myDelegation
    );
    return useQuery<Election, Error>({
        queryKey,
        queryFn,
        enabled:
            Boolean(loggedInMember) &&
            Boolean(electionState) &&
            Boolean(myDelegation),
    });
};
