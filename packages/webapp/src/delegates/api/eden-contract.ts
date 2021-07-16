import { devUseFixtureData } from "config";
import { ElectionState } from "elections/interfaces";
import {
    CONTRACT_CURRENT_ELECTION_TABLE,
    CONTRACT_ELECTION_STATE_TABLE,
    getTableRows,
} from "_app";
import { fixtureElectionState } from "./fixtures";

const getDelegates = () => {
    return {}; // TODO
};

export const getHeadDelegate = async (): Promise<string | undefined> => {
    const electionState = await getElectionState();
    return electionState?.lead_representative;
};

export const getChiefDelegates = async (): Promise<string[] | undefined> => {
    const electionState = await getElectionState();
    return electionState?.board;
};

export const getCurrentElection = async () => {
    const rows = await getTableRows<any>(CONTRACT_CURRENT_ELECTION_TABLE);

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

    if (!rows.length) {
        return undefined;
    }

    return rows[0];
};

const getMemberBudgetBalance = () => {
    return {}; // TODO
};

const getMemberElectionParticipationStatus = () => {
    return {}; // TODO
};

const hasMemberRSVPed = () => {
    return false; // TODO
};

export const getMyDelegation = () => {
    return {}; // TODO
};
