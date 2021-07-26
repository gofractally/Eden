import { getElectionState } from "elections/api";
import { EdenMember, getEdenMember, MemberData } from "members";
import { queryClient } from "pages/_app";

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

    const leadRepresentative = await queryClient.fetchQuery(
        "query_head_delegate",
        getHeadDelegate
    );
    let nextDelegate: EdenMember = await queryClient.fetchQuery(
        ["query_member", loggedInMemberAccount],
        () => getEdenMember(loggedInMemberAccount)
    );
    if (!nextDelegate || !leadRepresentative) return myDelegates;

    while (
        nextDelegate!.account !== leadRepresentative &&
        memberHasRepresentative(nextDelegate)
    ) {
        myDelegates.push(nextDelegate);
        const delegateRep = nextDelegate!.representative;
        nextDelegate = await queryClient.fetchQuery(
            ["query_member", delegateRep],
            () => getEdenMember(delegateRep)
        );
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
