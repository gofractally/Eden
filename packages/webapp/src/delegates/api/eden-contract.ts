import { EdenMember } from "members";
import { queryClient } from "pages/_app";
import { queryElectionState, queryMemberByAccountName } from "_app";

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

// check that member has participated in an election (if there's been one yet) (!="zzz...") and came to consensus with their group in the last election (!=0)
const MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION =
    "zzzzzzzzzzzzj";
const MEMBER_REPRESENTATIVE_IF_FAILED_TO_REACH_CONSENSUS = "";
export const isValidDelegate = (memberRep: string) =>
    memberRep !== MEMBER_REPRESENTATIVE_IF_FAILED_TO_REACH_CONSENSUS &&
    memberRep !== MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION;

export const isSubChiefDelegate = async (memberRep: string) => {
    const electionState = await queryClient.fetchQuery(
        queryElectionState.queryKey,
        queryElectionState.queryFn
    );
    if (!electionState) return Promise.resolve(isValidDelegate(memberRep));

    return Promise.resolve(
        isValidDelegate(memberRep) &&
            electionState.lead_representative !== memberRep &&
            !electionState.board.includes(memberRep)
    );
};

const getMemberWrapper = async (account: string) => {
    const { queryKey, queryFn } = queryMemberByAccountName(account);
    return await queryClient.fetchQuery(queryKey, queryFn);
};

// export const getMyDelegation2 = async (account: string | undefined
// ): Promise<EdenMember[]> => {
//     for(let idx=0; idx < numLevels;) {

//     }
// }

export const getMyDelegation = async (
    loggedInMemberAccount: string | undefined
): Promise<EdenMember[]> => {
    let myDelegates: EdenMember[] = [];

    if (!loggedInMemberAccount) return myDelegates;

    let nextMemberAccount = loggedInMemberAccount;
    console.info("1.nextMemberAccount:");
    console.info(nextMemberAccount);
    let isHeadChief: Boolean;
    do {
        console.info("myDelegates.top:");
        console.info(myDelegates);
        //  member = getMember(nextMemberAccount)
        let member = await getMemberWrapper(nextMemberAccount);
        if (!member)
            throw new Error(
                `Member record not found for provided account[${nextMemberAccount}].`
            );

        //  Fill the array from idx=0 up to member.election_rank with member
        console.info("for.member:");
        console.info(member);
        console.info(
            `myDelegates.length[${myDelegates.length}], election_rank[${member?.election_rank}]`
        );
        for (let idx = myDelegates.length; idx < member?.election_rank; idx++) {
            myDelegates.push(member);
        }
        //  nextMemberAccount = member.rep
        isHeadChief = member.account === member.representative;
        nextMemberAccount = member.representative;
        console.info("2.nextMemberAccount:");
        console.info(nextMemberAccount);
        console.info("myDelegates.bottom:");
        console.info(myDelegates);
    } while (isValidDelegate(nextMemberAccount) && !isHeadChief);

    return myDelegates;
};
