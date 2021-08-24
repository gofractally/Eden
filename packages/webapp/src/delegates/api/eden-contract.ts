import { devUseFixtureData } from "config";
import { EdenMember } from "members";
import { queryClient } from "pages/_app";
import {
    CONTRACT_DISTRIBUTION_ACCOUNTS_TABLE,
    getTableRows,
    i128BoundsForAccount,
    INDEX_BY_OWNER,
    isValidDelegate,
    queryElectionState,
    queryMemberByAccountName,
    queryVoteDataRow,
    TABLE_INDEXES,
} from "_app";

import { DistributionAccount } from "../interfaces";
import { DISTRIBUTION_ACCOUNTS } from "./fixtures";

const queryElectionStateHelper = async () =>
    await queryClient.fetchQuery(
        queryElectionState.queryKey,
        queryElectionState.queryFn
    );

export const getHeadDelegate = async (): Promise<string | undefined> => {
    const electionState = await queryElectionStateHelper();
    return electionState?.lead_representative;
};

export const getChiefDelegates = async (): Promise<string[] | undefined> => {
    const electionState = await queryElectionStateHelper();
    return electionState?.board;
};

const getMemberBudgetBalance = () => {
    return {}; // TODO
};

const getMemberWrapper = async (account: string) => {
    const { queryKey, queryFn } = queryMemberByAccountName(account);
    return await queryClient.fetchQuery(queryKey, queryFn);
};

export const getMyDelegation = async (
    loggedInMemberAccount?: string,
    highestCompletedRoundIndex?: number
): Promise<EdenMember[]> => {
    let myDelegates: EdenMember[] = [];

    if (!loggedInMemberAccount || highestCompletedRoundIndex === undefined)
        return myDelegates;

    let nextMemberAccount = loggedInMemberAccount;
    let isHeadChief: Boolean;
    do {
        let member = await getMemberWrapper(nextMemberAccount);
        if (!member)
            throw new Error(
                `Member record not found for provided account [${nextMemberAccount}].`
            );
        const memberVoteData = await queryClient.fetchQuery(
            queryVoteDataRow(nextMemberAccount)
        );
        const memberRankIndex = memberVoteData?.round ?? member.election_rank;

        // Fill the array from next available position up to member.election_rank with member,
        // in case this delegate got voted up through multiple levels
        for (
            let idx = myDelegates.length;
            idx <= memberRankIndex && idx <= highestCompletedRoundIndex;
            idx++
        ) {
            myDelegates.push(member);
        }
        isHeadChief = member.account === member.representative;
        nextMemberAccount = member.representative;
    } while (isValidDelegate(nextMemberAccount) && !isHeadChief);

    return myDelegates;
};

export const getDistributionsForAccount = async (
    account: string
): Promise<DistributionAccount[]> => {
    const { lower, upper } = i128BoundsForAccount(account);

    if (devUseFixtureData) {
        return DISTRIBUTION_ACCOUNTS;
    }

    const distributionRows = await getTableRows(
        CONTRACT_DISTRIBUTION_ACCOUNTS_TABLE,
        {
            ...TABLE_INDEXES[CONTRACT_DISTRIBUTION_ACCOUNTS_TABLE][
                INDEX_BY_OWNER
            ],
            lowerBound: lower,
            upperBound: upper,
            limit: 9999,
        }
    );

    return distributionRows as DistributionAccount[];
};
