import * as eosjsSerialize from "eosjs/dist/eosjs-serialize";
import * as eosjsNumeric from "eosjs/dist/eosjs-numeric";

import { devUseFixtureData } from "config";
import { queryClient } from "pages/_app";
import {
    CONTRACT_CURRENT_ELECTION_TABLE,
    CONTRACT_ELECTION_STATE_TABLE,
    CONTRACT_MEMBER_TABLE,
    CONTRACT_VOTE_TABLE,
    getRow,
    getTableRawRows,
    getTableRows,
    isValidDelegate,
    queryMemberByAccountName,
} from "_app";
import {
    EdenMember,
    VoteDataQueryOptionsByField,
    VoteDataQueryOptionsByGroup,
} from "members";
import {
    ActiveStateConfigType,
    ElectionState,
    VoteData,
} from "elections/interfaces";
import {
    fixtureCurrentElection,
    fixtureElectionState,
    fixtureVoteDataRow,
    fixtureVoteDataRows,
} from "./fixtures";
import { fixtureMembersInGroup } from "members/api/fixtures";

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
    memberAccount?: string,
    config?: ActiveStateConfigType
) => {
    if (!config)
        throw new Error(
            "getMemberGroupParticipants requires a config object (got 'undefined')"
        );
    if (!memberAccount)
        throw new Error(
            "getMemberGroupParticipants requires an account (got 'undefined')"
        );

    const totalParticipants = config.num_participants;
    const numGroups = config.num_groups;

    // get member index
    const memberVoteData = await getVoteDataRow({
        fieldValue: memberAccount,
        fieldName: "member",
    });
    if (!memberVoteData) return [];

    // return all indexes that represent members in this member's group
    const { lowerBound, upperBound } = getMemberGroupFromIndex(
        // TODO: remove this -1 if no conversion is needed between 0=based and 1=based arrays
        memberVoteData.index,
        totalParticipants,
        numGroups
    );

    const GET_VOTE_DATA_ROWS_LIMIT = 20;

    // get all members in this member's group
    const rows = await getVoteDataRows({
        lowerBound,
        upperBound,
        limit: GET_VOTE_DATA_ROWS_LIMIT,
        key_type: "i64",
        index_position: 2,
    });

    if (!rows || !rows.length) {
        return undefined;
    }

    return rows;
};

export const getVoteDataRow = async (
    opts: VoteDataQueryOptionsByField
): Promise<VoteData | undefined> => {
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
    const rawRows = await getTableRawRows(CONTRACT_VOTE_TABLE, opts);

    if (rawRows?.[0].length) return rawRows.map((row) => row[1]);
    return rawRows;
};

export const getVoteData = getVoteDataRows;

const getCommonDelegateAccountForGroupWithThisMember = (
    round: number,
    member: EdenMember,
    isStillParticipating: boolean
) => {
    console.info(
        `getCommonDelegateAccountForGroupWithThisMember(round[${round}], isStillParticipating[${isStillParticipating}]).top member:`
    );
    console.info(member);

    const commonDelegateIfDoneParticipating =
        member.election_rank > round ? member.account : member.representative;
    const commonDelegate = isStillParticipating
        ? member.account
        : commonDelegateIfDoneParticipating;

    return isValidDelegate(commonDelegate) ? commonDelegate : "";
};

export const getParticipantsInCompletedRound = async (
    electionRound: number,
    member: EdenMember,
    isStillParticipating: boolean
): Promise<{ participants: EdenMember[]; delegate?: string } | undefined> => {
    const commonDelegate = getCommonDelegateAccountForGroupWithThisMember(
        electionRound,
        member,
        isStillParticipating
    );
    console.info(`commonDelegate[${commonDelegate}]`);
    if (!commonDelegate) return undefined;

    if (devUseFixtureData)
        return {
            participants: fixtureMembersInGroup(electionRound, commonDelegate),
            delegate: commonDelegate,
        };

    const serialBuffer = new eosjsSerialize.SerialBuffer();
    serialBuffer.pushName(commonDelegate);
    serialBuffer.pushNumberAsUint64(electionRound);

    const bytes = serialBuffer.getUint8Array(16);
    const bounds: string = eosjsNumeric.signedBinaryToDecimal(bytes).toString();

    const participants = await getTableRows(CONTRACT_MEMBER_TABLE, {
        index_position: 2,
        key_type: "i128",
        lowerBound: bounds,
        upperBound: bounds,
        limit: 20,
    });

    const delegateAccountName = participants?.[0].representative;
    if (!isValidDelegate(delegateAccountName)) return { participants };

    const { queryKey, queryFn } = queryMemberByAccountName(delegateAccountName);
    const delegate = await queryClient.fetchQuery(queryKey, queryFn);
    return {
        participants: [delegate, ...participants],
        delegate: delegateAccountName,
    };
};

export const getCurrentElection = async () => {
    // 1. When testing Registration phase
    // if (devUseFixtureData) return fixtureRegistrationElection;

    // 2. When testing Current election phase
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
