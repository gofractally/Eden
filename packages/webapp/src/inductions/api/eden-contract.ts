import { Endorsement, Induction } from "inductions/interfaces";
import {
    CONTRACT_INDUCTION_TABLE,
    getRow,
    i128BoundsForAccount,
    getTableIndexRows,
    CONTRACT_ENDORSEMENT_TABLE,
} from "_app";

import {
    INDUCTION_NEW_MOCK,
    INDUCTION_PENDING_ENDORSEMENTS_MOCK,
    INDUCTION_PENDING_LAST_ENDORSEMENT_MOCK,
    INDUCTION_PENDING_VIDEO_MOCK,
} from "../__mocks__/inductions";

// eosio secondary indexes for inductions defined at:
// /contracts/eden/include/inductions.hpp
const INDEX_BY_INVITEE = 2;
const INDEX_BY_INVITER = 3;
const INDEX_BY_ENDORSER = 2;

export const getInduction = async (inductionId: string) =>
    // TODO: remove mock when table is fixed
    (INDUCTION_NEW_MOCK &&
        INDUCTION_PENDING_VIDEO_MOCK &&
        INDUCTION_PENDING_ENDORSEMENTS_MOCK &&
        INDUCTION_PENDING_LAST_ENDORSEMENT_MOCK) ||
    getRow(CONTRACT_INDUCTION_TABLE, "id", inductionId);

export const getCurrentInductions = async (
    account: string,
    isActive: boolean
) => {
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

    const endorsements: Endorsement[] = isActive
        ? await getTableIndexRows(
              CONTRACT_ENDORSEMENT_TABLE,
              INDEX_BY_ENDORSER,
              "i128",
              lower,
              upper,
              99999
          )
        : [];

    return { inductions, endorsements };
};
