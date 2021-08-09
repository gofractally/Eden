import { CONTRACT_GLOBAL_TABLE, getTableRows } from "_app";

// check that member has participated in an election (if there's been one yet) (!="zzz...") and came to consensus with their group in the last election (!=0)
const MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION =
    "zzzzzzzzzzzzj";
// groups that didn't come to consensus will be assigned an invalid-EOS-account value for representative
// that's shared among group members (so you can still determine them to have been in the same group).
// These non-rep values, since they're stored in the `representative` field
// will be distinguishable by the fact that they're 13 characters long, making them invalid EOS account names
const isARepresentativeResultingFromConsensus = (representativeValue: string) =>
    representativeValue.length !== 13;

export const isValidDelegate = (memberRep: string) =>
    memberRep !==
        MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION &&
    isARepresentativeResultingFromConsensus(memberRep);

export const getIsCommunityActive = async (): Promise<boolean> => {
    const rows = await getTableRows(CONTRACT_GLOBAL_TABLE, {
        lowerBound: "community",
    });
    if (rows?.length) {
        return rows[0].stage > 0;
    }
    return false;
};
