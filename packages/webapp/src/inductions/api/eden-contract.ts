import {
    CONTRACT_INDUCTION_TABLE,
    getRow,
    i128BoundsForAccount,
    getTableIndexRows,
    CONTRACT_ENDORSEMENT_TABLE,
    getTableRows,
} from "_app";

import { Endorsement, Induction } from "../interfaces";

// eosio secondary indexes for inductions defined at:
// /contracts/eden/include/inductions.hpp
const INDEX_BY_INVITEE = 2;
const INDEX_BY_INVITER = 3;
const INDEX_BY_ENDORSER = 2;
const INDEX_BY_INDUCTION = 3;

export const getInductionWithEndorsements = async (
    inductionId: string
): Promise<
    | {
          induction: Induction;
          endorsements: Endorsement[];
      }
    | undefined
> => {
    const induction = await getInduction(inductionId);
    if (induction) {
        const endorsements = await getEndorsementsByInductionId(inductionId);
        return { induction, endorsements };
    }
};

export const getInduction = async (
    inductionId: string
): Promise<Induction | undefined> => {
    const induction = await getRow<Induction>(
        CONTRACT_INDUCTION_TABLE,
        "id",
        inductionId
    );
    if (induction) {
        console.info("retrieved induction", induction);
        return induction;
    }
};

export const getEndorsementsByInductionId = async (
    inductionId: string
): Promise<Endorsement[]> => {
    const endorsementsRows = await getTableIndexRows(
        CONTRACT_ENDORSEMENT_TABLE,
        INDEX_BY_INDUCTION,
        "i64",
        inductionId,
        inductionId
    );
    console.info("retrieved endorsement", endorsementsRows);
    const endorsements = endorsementsRows.filter(
        (endorsement: Endorsement) => endorsement.induction_id === inductionId
    );
    return endorsements;
};

export const getCurrentInductions = async (
    account: string,
    isActive: boolean
): Promise<{ inductions: Induction[]; endorsements: Endorsement[] }> => {
    const indexPosition = isActive ? INDEX_BY_INVITER : INDEX_BY_INVITEE;
    const { lower, upper } = i128BoundsForAccount(account);

    const [inductions, endorsements] = (await Promise.all([
        getTableIndexRows(
            CONTRACT_INDUCTION_TABLE,
            indexPosition,
            "i128",
            lower,
            upper,
            9999
        ),
        getTableIndexRows(
            CONTRACT_ENDORSEMENT_TABLE,
            INDEX_BY_ENDORSER,
            "i128",
            lower,
            upper,
            99999
        ),
    ])) as [Induction[], Endorsement[]];

    return { inductions, endorsements };
};

export const getInductions = async (
    lowerBound?: string,
    upperBound?: string,
    limit = 10
): Promise<Induction[]> =>
    getTableRows<Induction>(CONTRACT_INDUCTION_TABLE, {
        lowerBound,
        upperBound,
        limit,
    });
