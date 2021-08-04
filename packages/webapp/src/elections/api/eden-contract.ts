import { devUseFixtureData } from "config";
import {
    ActiveStateConfigType,
    ElectionState,
    VoteData,
} from "elections/interfaces";
import {
    VoteDataQueryOptionsByField,
    VoteDataQueryOptionsByGroup,
} from "members";
import {
    CONTRACT_CURRENT_ELECTION_TABLE,
    CONTRACT_ELECTION_STATE_TABLE,
    CONTRACT_VOTE_TABLE,
    getRow,
    getTableRawRows,
} from "_app";
import {
    fixtureCurrentElection,
    fixtureElectionState,
    fixtureVoteDataRow,
    fixtureVoteDataRows,
} from "./fixtures";

const getMemberGroupFromIndex = (
    memberIdx: number,
    totalParticipants: number,
    numGroups: number
) => {
    const maxGroupSize = Math.floor(
        (totalParticipants + numGroups - 1) / numGroups
    );
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
        groupNumber: groupNumber,
        lowerBound: lowerBound,
        upperBound: upperBound,
    };
};

export const getMemberGroupParticipants = async (
    memberAccount: string | undefined,
    config: ActiveStateConfigType
) => {
    if (!memberAccount || !config) return undefined;

    const totalParticipants = config.num_participants;
    const numGroups = config.num_groups;

    // get member index
    const memberVoteData = await getVoteDataRow({
        fieldValue: memberAccount,
    });
    if (!memberVoteData) return [];

    // return all indexes that represent members in this member's group
    const { groupNumber, lowerBound, upperBound } = getMemberGroupFromIndex(
        // TODO: remove this -1 if no conversion is needed between 0=based and 1=based arrays
        memberVoteData.index,
        totalParticipants,
        numGroups
    );

    // get all members in this member's group
    const rows = await getVoteDataRows({
        lowerBound,
        upperBound,
    });

    if (!rows || !rows.length) {
        return undefined;
    }

    return rows;
};

export const getVoteDataRow = async (
    opts?: VoteDataQueryOptionsByField
): Promise<VoteData | undefined> => {
    if (!opts) return undefined;
    if (devUseFixtureData)
        return Promise.resolve(fixtureVoteDataRow(opts.fieldValue));

    const memberVoteData = await getRow<VoteData>(
        CONTRACT_VOTE_TABLE,
        opts.fieldName || "name",
        opts.fieldValue
    );
    return memberVoteData;
};

const getVoteDataRows = async (
    opts: VoteDataQueryOptionsByGroup
): Promise<VoteData[] | undefined> => {
    if (devUseFixtureData)
        return Promise.resolve(
            fixtureVoteDataRows.filter(
                (vote) =>
                    vote.index >= opts.lowerBound &&
                    vote.index <= opts.upperBound
            )
        );

    // TODO: see what real data looks like and real use-cases and see if we need the electionState flag;
    // If not, switch this back to getTableRows()
    const rawRows = await getTableRawRows<VoteData>(CONTRACT_VOTE_TABLE, opts);
    // const electionState = rawRows[0][0];

    const rows = rawRows.map((row) => row[1]);

    if (!rows.length) {
        return undefined;
    }

    return rows;
};

export const getVoteData = getVoteDataRows;

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

    return await getRow<ElectionState>(CONTRACT_ELECTION_STATE_TABLE);
};

const getMemberElectionParticipationStatus = () => {
    return {}; // TODO
};

const hasMemberRSVPed = () => {
    return false; // TODO
};
