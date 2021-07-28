import { EdenMember } from "members";
import { queryClient } from "pages/_app";
import {
    queryElectionState,
    queryHeadDelegate,
    queryMemberByAccountName,
} from "_app";

const queryElectionStateHelper = async () => {
    try {
        return await queryClient.fetchQuery(
            queryElectionState.queryKey,
            queryElectionState.queryFn
        );
    } catch (e) {
        console.error("Error in getMyDelegation:");
        console.error(e);
        return Promise.resolve(undefined);
    }
};

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

// check that member has participated in an election (if there's been one yet) (!="zzz...") and came to consensus with their group in the last election (!=0)
const MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION =
    "zzzzzzzzzzzzj";
const MEMBER_REPRESENTATIVE_IF_FAILED_TO_REACH_CONSENSUS = "";
const memberHasRepresentative = (member: EdenMember) =>
    member.account !== MEMBER_REPRESENTATIVE_IF_FAILED_TO_REACH_CONSENSUS &&
    member.account !==
        MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION;

export const getMyDelegation = async (
    loggedInMemberAccount: string | undefined
): Promise<EdenMember[]> => {
    let myDelegates: EdenMember[] = [];

    if (!loggedInMemberAccount) return myDelegates;

    try {
        const leadRepresentative = await queryClient.fetchQuery(
            queryHeadDelegate.queryKey,
            queryHeadDelegate.queryFn
        );

        // NEXT: add fixtures for each of these querys and test the logic (that I couldn't test before)

        const { queryKey, queryFn } = queryMemberByAccountName(
            loggedInMemberAccount
        );
        let nextDelegate: EdenMember = await queryClient.fetchQuery(
            queryKey,
            queryFn
        );
        if (!nextDelegate || !leadRepresentative) return myDelegates;

        while (
            nextDelegate!.account !== leadRepresentative &&
            memberHasRepresentative(nextDelegate)
        ) {
            myDelegates.push(nextDelegate);
            const { queryKey, queryFn } = queryMemberByAccountName(
                nextDelegate!.representative
            );
            nextDelegate = await queryClient.fetchQuery(queryKey, queryFn);
            if (!nextDelegate) return myDelegates;
        }
        if (
            nextDelegate.account === leadRepresentative &&
            memberHasRepresentative(nextDelegate)
        ) {
            myDelegates.push(nextDelegate);
        }
    } catch (e) {
        console.error("Error in getMyDelegation:");
        console.error(e);
        return [];
    }
    return myDelegates;
};
