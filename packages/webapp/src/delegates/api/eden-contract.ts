import { getElectionState } from "elections/api";
import { EdenMember, getEdenMember, MemberData } from "members";

export const getHeadDelegate = async (): Promise<string | undefined> => {
    const electionState = await getElectionState();
    return electionState?.lead_representative;
};

export const getChiefDelegates = async (): Promise<string[] | undefined> => {
    const electionState = await getElectionState();
    return electionState?.board;
};

const getMemberBudgetBalance = () => {
    return {}; // TODO
};

const MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION =
    "zzzzzzzzzzzzj";
// check that member has participated in an election (if there's been one yet) (!="zzz...") and came to consensus with their group in the last election (!=0)
const memberHasRepresentative = (member: EdenMember) =>
    member.account !== "" &&
    member.account !==
        MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION;

export const getMyDelegation = async (
    loggedInMemberAccount: string | undefined
): Promise<EdenMember[]> => {
    let myDelegates: EdenMember[] = [];

    if (!loggedInMemberAccount) return myDelegates;

    const leadRepresentative = await getHeadDelegate();
    let nextDelegate = await getEdenMember(loggedInMemberAccount);
    if (!nextDelegate || !leadRepresentative) return myDelegates;

    while (
        nextDelegate!.account !== leadRepresentative &&
        memberHasRepresentative(nextDelegate)
    ) {
        myDelegates.push(nextDelegate);
        nextDelegate = await getEdenMember(nextDelegate!.representative);
        if (!nextDelegate) return myDelegates;
    }
    if (
        nextDelegate.account === leadRepresentative &&
        memberHasRepresentative(nextDelegate)
    ) {
        myDelegates.push(nextDelegate);
    }
    return myDelegates;
};
