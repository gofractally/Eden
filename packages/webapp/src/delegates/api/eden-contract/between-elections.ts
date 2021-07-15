import { devUseFixtureData } from "config";
import { ElectionState } from "elections/interfaces";
import {
    CONTRACT_CURRENT_ELECTION_TABLE,
    CONTRACT_ELECTION_STATE_TABLE,
    getTableRows,
} from "_app";
import { fixtureElectionState } from "../fixtures";

const getDelegates = () => {
    return {};
};

export const getHeadDelegate = async (): Promise<string | undefined> => {
    const electionState = await getElectionState();
    return electionState && electionState.lead_representative;
};

export const getChiefDelegates = async (): Promise<string[] | undefined> => {
    const electionState = await getElectionState();
    return electionState && electionState.board;
};

export const getCurrentElection = async () => {
    const rows = await getTableRows<any>(CONTRACT_CURRENT_ELECTION_TABLE);
    console.info("getCurrentElection().rows:");
    console.info(rows);

    if (!rows.length) {
        return undefined;
    }

    return rows[0];
};

export const getElectionState = async () => {
    if (devUseFixtureData) return fixtureElectionState;

    const rows = await getTableRows<ElectionState>(
        CONTRACT_ELECTION_STATE_TABLE
    );
    console.info("getElectionState().rows:");
    console.info(rows);

    if (!rows.length) {
        return undefined;
    }

    return rows[0];
};

const getMemberBudgetBalance = () => {
    return {};
};

const getMemberElectionParticipationStatus = () => {
    return {};
};

const hasMemberRSVPed = () => {
    return false;
};

export const getMyDelegation = () => {
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
