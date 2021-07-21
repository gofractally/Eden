import { devUseFixtureData } from "config";
import { ElectionState, VoteData } from "elections/interfaces";
import {
    CONTRACT_CURRENT_ELECTION_TABLE,
    CONTRACT_ELECTION_STATE_TABLE,
    CONTRACT_VOTE_TABLE,
    getRow,
    getTableRawRows,
    getTableRows,
} from "_app";
import { fixtureCurrentElection, fixtureElectionState } from "./fixtures";

export const getVoteTable = async (memberName: string) => {
    // if (devUseFixtureData) return fixtureCurrentElection;
    const memberVoteData = await getRow<VoteData>(
        CONTRACT_VOTE_TABLE,
        "name",
        memberName
    );

    console.info("getVoteTable().got data:");
    console.info(memberVoteData);

    if (memberVoteData) {
        console.info("retrieved member's vote data:", memberVoteData);
        return memberVoteData;
    }
};
export const getCurrentElection = async () => {
    if (devUseFixtureData) return fixtureCurrentElection;

    const rawRows = await getTableRawRows<any>(CONTRACT_CURRENT_ELECTION_TABLE);
    const electionState = rawRows[0][0];

    const rows = rawRows.map((row) => row[1]);

    if (!rows.length) {
        return undefined;
    }

    return { electionState, ...rows[0] };
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

const getMemberElectionParticipationStatus = () => {
    return {}; // TODO
};

const hasMemberRSVPed = () => {
    return false; // TODO
};
