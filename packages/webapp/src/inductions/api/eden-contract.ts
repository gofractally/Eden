import { CONTRACT_INDUCTION_TABLE, getRow } from "_app";

import {
    INDUCTION_NEW_MOCK,
    INDUCTION_PENDING_ENDORSEMENTS_MOCK,
    INDUCTION_PENDING_LAST_ENDORSEMENT_MOCK,
    INDUCTION_PENDING_VIDEO_MOCK,
} from "../__mocks__/inductions";

export const getInduction = async (inductionId: string) =>
    // TODO: remove mock when table is fixed
    (INDUCTION_NEW_MOCK &&
        INDUCTION_PENDING_VIDEO_MOCK &&
        INDUCTION_PENDING_ENDORSEMENTS_MOCK &&
        INDUCTION_PENDING_LAST_ENDORSEMENT_MOCK) ||
    getRow(CONTRACT_INDUCTION_TABLE, "id", inductionId);
