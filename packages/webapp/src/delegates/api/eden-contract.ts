import { getElectionState } from "elections/api";
import { MemberData } from "members";

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

export const getMemberRecordFromName = (
    members: MemberData[],
    memberAccount: string
) => members.find((member) => member.account === memberAccount);

// check that member has participated in an election (if there's been one yet) (!="zzz...") and came to consensus with their group in the last election (!=0)
const memberHasRepresentative = (member: MemberData) =>
    member.account !== "" && member.account !== "zzzzzzzzzzzzj";

export const getMyDelegation = async (
    members: MemberData[],
    loggedInMemberName: string
): Promise<MemberData[]> => {
    let myDelegates: MemberData[] = [];

    const leadRepresentative = await getHeadDelegate();
    let nextDelegate = getMemberRecordFromName(members, loggedInMemberName);
    if (!nextDelegate || !leadRepresentative) return myDelegates;

    while (
        nextDelegate!.account !== leadRepresentative &&
        memberHasRepresentative(nextDelegate)
    ) {
        myDelegates.push(nextDelegate);
        nextDelegate = getMemberRecordFromName(
            members,
            nextDelegate!.representative
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
