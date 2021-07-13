export const getCurrentElectionRound = () => {
    return {};
};

export const getParticipantsOfRound = (round: number) => {
    return {};
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
