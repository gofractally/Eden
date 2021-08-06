import { CONTRACT_GLOBAL_TABLE, getTableRows } from "_app";

// check that member has participated in an election (if there's been one yet) (!="zzz...") and came to consensus with their group in the last election (!=0)
const MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION =
    "zzzzzzzzzzzzj";
const MEMBER_REPRESENTATIVE_IF_FAILED_TO_REACH_CONSENSUS = "";
export const isValidDelegate = (memberRep: string) =>
    memberRep !== MEMBER_REPRESENTATIVE_IF_FAILED_TO_REACH_CONSENSUS &&
    memberRep !== MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION;

export const getIsCommunityActive = async (): Promise<boolean> => {
    const rows = await getTableRows(CONTRACT_GLOBAL_TABLE, {
        lowerBound: "community",
    });
    if (rows?.length) {
        return rows[0].stage > 0;
    }
    return false;
};
