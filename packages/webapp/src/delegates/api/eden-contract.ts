import { EdenMember } from "members";
import { queryClient } from "pages/_app";
import {
    isValidDelegate,
    queryElectionState,
    queryMemberByAccountName,
} from "_app";

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
    loggedInMemberAccount: string | undefined
): Promise<EdenMember[]> => {
    let myDelegates: EdenMember[] = [];

    if (!loggedInMemberAccount) return myDelegates;

    let nextMemberAccount = loggedInMemberAccount;
    let isHeadChief: Boolean;
    do {
        let member = await getMemberWrapper(nextMemberAccount);
        if (!member)
            throw new Error(
                `Member record not found for provided account [${nextMemberAccount}].`
            );

        // Fill the array from next available position up to member.election_rank with member,
        // in case this delegate got voted up through multiple levels
        for (
            let idx = myDelegates.length;
            idx <= member?.election_rank;
            idx++
        ) {
            myDelegates.push(member);
        }
        isHeadChief = member.account === member.representative;
        nextMemberAccount = member.representative;
    } while (isValidDelegate(nextMemberAccount) && !isHeadChief);

    return myDelegates;
};
