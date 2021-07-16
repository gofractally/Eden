// PLACEHOLDER

import { now } from "cypress/types/lodash";
// import {
//     CONTRACT_INDUCTION_TABLE,
//     getRow,
//     i128BoundsForAccount,
//     getTableIndexRows,
//     CONTRACT_ENDORSEMENT_TABLE,
//     getTableRows,
// } from "_app";

export const getNextElectionDateTime = () => {
    return now();
};

// export const getInductionWithEndorsements = async (
//     inductionId: string
// ): Promise<
//     | {
//           induction: Induction;
//           endorsements: Endorsement[];
//       }
//     | undefined
// > => {
//     const induction = await getInduction(inductionId);
//     if (induction) {
//         const endorsements = await getEndorsementsByInductionId(inductionId);
//         return { induction, endorsements };
//     }
// };
