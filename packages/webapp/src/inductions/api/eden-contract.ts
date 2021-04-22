import { Endorsement, Induction } from "inductions/interfaces";
import {
    CONTRACT_INDUCTION_TABLE,
    getRow,
    i128BoundsForAccount,
    getTableIndexRows,
    CONTRACT_ENDORSEMENT_TABLE,
} from "_app";

// eosio secondary indexes for inductions defined at:
// /contracts/eden/include/inductions.hpp
const INDEX_BY_INVITEE = 2;
const INDEX_BY_INVITER = 3;
const INDEX_BY_ENDORSER = 2;
const INDEX_BY_INDUCTION = 3;

export const getInduction = async (
    inductionId: string
): Promise<{
    induction: Induction;
    endorsements: Endorsement[];
}> => {
    const induction = await getRow(CONTRACT_INDUCTION_TABLE, "id", inductionId);
    console.info("retrieved induction", induction);

    let endorsements: Endorsement[] = [];
    if (induction) {
        const endorsementsRows = await getTableIndexRows(
            CONTRACT_ENDORSEMENT_TABLE,
            INDEX_BY_INDUCTION,
            "i64",
            induction.id
        );
        endorsements = endorsementsRows.filter(
            (endorsement: Endorsement) =>
                endorsement.induction_id === induction.id
        );
    }

    return { induction, endorsements };
};

export const getCurrentInductions = async (
    account: string,
    isActive: boolean
): Promise<{ inductions: Induction[]; endorsements: Endorsement[] }> => {
    const indexPosition = isActive ? INDEX_BY_INVITER : INDEX_BY_INVITEE;
    const { lower, upper } = i128BoundsForAccount(account);

    const inductions: Induction[] = await getTableIndexRows(
        CONTRACT_INDUCTION_TABLE,
        indexPosition,
        "i128",
        lower,
        upper,
        9999
    );

    const endorsements: Endorsement[] = await getTableIndexRows(
        CONTRACT_ENDORSEMENT_TABLE,
        INDEX_BY_ENDORSER,
        "i128",
        lower,
        upper,
        99999
    );

    return { inductions, endorsements };
};
