import { devUseFixtureData } from "config";
import { EdenMember } from "members";
import { queryClient } from "pages/_app";
import {
    CONTRACT_DISTRIBUTION_TABLE,
    CONTRACT_POOLS_TABLE,
    getRow,
    getTableRawRows,
    isValidDelegate,
    queryElectionState,
    queryMemberByAccountName,
    queryVoteDataRow,
} from "_app";

import {
    DistributionState,
    DistributionStateData,
    Distribution,
    Pool,
} from "../interfaces";
import { fixtureNextDistribution, fixturePool } from "./fixtures";

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
    let currRound = highestCompletedRoundIndex + 1;
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
            currRound -= 1;
        }
        isHeadChief = member.account === member.representative;
        nextMemberAccount = member.representative;
    } while (currRound && isValidDelegate(nextMemberAccount) && !isHeadChief);

    return myDelegates;
};

export const getDistributionState = async (): Promise<
    DistributionStateData | undefined
> => {
    if (devUseFixtureData) {
        return fixtureNextDistribution;
    }

    const rawRows = await getTableRawRows<any>(CONTRACT_DISTRIBUTION_TABLE);

    if (!rawRows || !rawRows.length || !rawRows[0].length) {
        return undefined;
    }

    const state: DistributionState = rawRows[0][0];
    const rows = rawRows.map((row) => row[1]);

    if (!rows.length) {
        return undefined;
    }

    return { state, data: rows[0] as Distribution };
};

export const getMasterPool = async (): Promise<Pool | undefined> => {
    if (devUseFixtureData) {
        return fixturePool;
    }
    return getRow<Pool>(CONTRACT_POOLS_TABLE, "name", "master");
};
