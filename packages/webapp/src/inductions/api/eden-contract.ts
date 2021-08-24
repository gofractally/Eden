import {
    CONTRACT_INDUCTION_TABLE,
    getRow,
    i128BoundsForAccount,
    CONTRACT_ENDORSEMENT_TABLE,
    getTableRows,
    TABLE_INDEXES,
    INDEX_BY_INDUCTION,
    INDEX_BY_INVITER,
    INDEX_BY_INVITEE,
    INDEX_BY_ENDORSER,
} from "_app";

import { Endorsement, Induction } from "../interfaces";

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
    const endorsementsRows = await getTableRows(CONTRACT_ENDORSEMENT_TABLE, {
        ...TABLE_INDEXES[CONTRACT_ENDORSEMENT_TABLE][INDEX_BY_INDUCTION],
        lowerBound: inductionId,
        upperBound: inductionId,
    });
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
    const { lower, upper } = i128BoundsForAccount(account);

    const [inductions, endorsements] = (await Promise.all([
        getTableRows(CONTRACT_INDUCTION_TABLE, {
            ...TABLE_INDEXES[CONTRACT_INDUCTION_TABLE][
                isActive ? INDEX_BY_INVITER : INDEX_BY_INVITEE
            ],
            lowerBound: lower,
            upperBound: upper,
            limit: 9999,
        }),
        getTableRows(CONTRACT_ENDORSEMENT_TABLE, {
            ...TABLE_INDEXES[CONTRACT_ENDORSEMENT_TABLE][INDEX_BY_ENDORSER],
            lowerBound: lower,
            upperBound: upper,
            limit: 99999,
        }),
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
