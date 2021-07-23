import { devUseFixtureData } from "config";
import {
    ActiveStateConfigType,
    ElectionState,
    VoteData,
} from "elections/interfaces";
import {
    CONTRACT_CURRENT_ELECTION_TABLE,
    CONTRACT_ELECTION_STATE_TABLE,
    CONTRACT_VOTE_TABLE,
    getRow,
    getTableRawRows,
    getTableRows,
} from "_app";
import {
    fixtureCurrentElection,
    fixtureElectionState,
    fixtureMemberGroupParticipants,
} from "./fixtures";

const getMemberGroupFromIndex = (
    memberIdx: number,
    totalParticipants: number,
    numGroups: number
) => {
    const maxGroupSize = (totalParticipants + numGroups - 1) / numGroups;
    const numShortGroups = maxGroupSize * numGroups - totalParticipants;
    const numLargeGroups = numGroups - numShortGroups;
    const minGroupSize = maxGroupSize - 1;
    const totalMembersInLargeGroups = (minGroupSize + 1) * numLargeGroups;
    let groupNumber = -1;
    let lowerBound = -1;
    let upperBound = -1;
    if (memberIdx < totalMembersInLargeGroups) {
        groupNumber = Math.floor(memberIdx / (minGroupSize + 1));
        lowerBound = groupNumber * (minGroupSize + 1);
        upperBound = lowerBound + minGroupSize;
    } else {
        groupNumber =
            Math.floor((memberIdx - totalMembersInLargeGroups) / minGroupSize) +
            numLargeGroups;
        lowerBound =
            (groupNumber - numLargeGroups) * minGroupSize +
            totalMembersInLargeGroups;
        upperBound = lowerBound + minGroupSize - 1;
    }
    return {
        groupNumber,
        lowerBound,
        upperBound,
    };
};

export const getMemberGroupParticipants = async (
    memberAccount: string | undefined,
    config: ActiveStateConfigType
) => {
    if (!memberAccount || !config) return undefined;

    const totalParticipants = config.num_participants;
    const numGroups = config.num_groups;
    // TODO: consider how to mock this more deeply to test the logic below
    if (devUseFixtureData) return fixtureMemberGroupParticipants;

    // get member index
    const memberVoteData = await getRow<VoteData>(
        CONTRACT_VOTE_TABLE,
        "name",
        memberAccount
    );
    if (!memberVoteData) return [];

    // return all indexes that represent members in this member's group
    const { groupNumber, lowerBound, upperBound } = getMemberGroupFromIndex(
        memberVoteData.index,
        totalParticipants,
        numGroups
    );

    // get all members in this member's group
    const rows = await getTableRows<VoteData[]>(CONTRACT_VOTE_TABLE, {
        index_position: 2,
        lowerBound,
        upperBound,
    });

    if (!rows.length) {
        return undefined;
    }

    return rows;
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
    return getRow<ElectionState>(CONTRACT_ELECTION_STATE_TABLE);
};

const getMemberElectionParticipationStatus = () => {
    return {}; // TODO
};

const hasMemberRSVPed = () => {
    return false; // TODO
};
