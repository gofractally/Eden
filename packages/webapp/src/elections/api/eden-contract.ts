import { devUseFixtureData } from "config";
import { ElectionState } from "elections/interfaces";
import {
    CONTRACT_CURRENT_ELECTION_TABLE,
    CONTRACT_ELECTION_STATE_TABLE,
    getTableRows,
} from "_app";
import { fixtureElectionState } from "./fixtures";

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
