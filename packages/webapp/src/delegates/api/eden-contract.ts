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
) => members?.filter((member) => member.account === memberAccount)[0];

export const getMyDelegation = async (
    members: MemberData[],
    loggedInMemberName: string
): Promise<MemberData[]> => {
    let myDelegates: MemberData[] = [];

    const lead_representative = await getHeadDelegate();

    const loggedInMember: MemberData | undefined =
        members && getMemberRecordFromName(members, loggedInMemberName);

    if (loggedInMember === undefined) return myDelegates;

    let m: MemberData = getMemberRecordFromName(
        members,
        loggedInMember?.account
    );
    while (m && m?.account != lead_representative) {
        myDelegates.push(m);
        m = getMemberRecordFromName(members, m?.representative!);
    }
    if (
        (members && myDelegates.length) ||
        loggedInMemberName === lead_representative
    ) {
        myDelegates.push(
            getMemberRecordFromName(members, lead_representative!)
        );
    }
    return myDelegates;
};
