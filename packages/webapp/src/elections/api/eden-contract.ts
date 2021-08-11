import * as eosjsSerialize from "eosjs/dist/eosjs-serialize";
import * as eosjsNumeric from "eosjs/dist/eosjs-numeric";

import { devUseFixtureData } from "config";
import { queryClient } from "pages/_app";
import {
    CONTRACT_CURRENT_ELECTION_TABLE,
    CONTRACT_ELECTION_STATE_TABLE,
    CONTRACT_MEMBER_TABLE,
    CONTRACT_VOTE_TABLE,
    Election,
    getRow,
    getTableRawRows,
    getTableRows,
    isValidDelegate,
    queryMemberByAccountName,
    queryMemberData,
    queryParticipantsInCompletedRound,
} from "_app";
import {
    EdenMember,
    MemberData,
    MemberStats,
    VoteDataQueryOptionsByField,
    VoteDataQueryOptionsByGroup,
} from "members";
import {
    ActiveStateConfigType,
    CurrentElection,
    ElectionState,
    ElectionStatus,
    VoteData,
} from "elections/interfaces";
import {
    fixtureCurrentElection,
    fixtureElectionState,
    fixtureVoteDataRow,
    fixtureVoteDataRows,
} from "./fixtures";
import { fixtureEdenMembersInGroup } from "members/api/fixtures";

const CONSENSUS_RESULT_NO_DELEGATE = "no delegate";

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
        memberVoteData.index,
        totalParticipants,
        numGroups
    );

    const GET_VOTE_DATA_ROWS_LIMIT = 20;

    // get all members in this member's group
    console.info("getVoteDRs()", { lowerBound, upperBound });
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
    console.info("rawRows:", rawRows);

    if (rawRows?.[0].length) return rawRows.map((row) => row[1]);
    return rawRows;
};

export const getVoteData = getVoteDataRows;

const getCommonDelegateAccountForGroupWithThisMember = (
    roundRequested: number,
    member: EdenMember,
    voteData?: VoteData
) => {
    let electionRankIndex = member.election_rank; // if member table has been updated for this election
    // if the member has an open voteData record (i.e., still participating), get their election rank from that
    if (voteData?.member === member.account) {
        electionRankIndex = voteData.round;
    }

    let commonDelegate = member.representative;
    if (electionRankIndex > roundRequested) {
        commonDelegate = member.account;
    } else if (electionRankIndex < roundRequested) {
        // TODO: No Consensus Scenario 2: this member was in Round 1, which didn't reach consensus, and we're asking about Round 2 for them, which never happened
        return CONSENSUS_RESULT_NO_DELEGATE;
        // throw new Error(
        //     "Cannot fetch round participants in round member did not participate in."
        // );
    }

    // No Conensus Scenario 1: requestedRound === electionRankIndex.
    // We'll get a commonDelegate; it just won't be a delegate, it'll be a group identifier
    return commonDelegate;
};

export const getParticipantsInCompletedRound = async (
    electionRound: number,
    member: EdenMember,
    voteData?: VoteData
): Promise<{ participants: EdenMember[]; delegate?: string } | undefined> => {
    // TODO: Add no-consensus scenario to this function
    const commonDelegate = getCommonDelegateAccountForGroupWithThisMember(
        electionRound,
        member,
        voteData
    );

    if (devUseFixtureData)
        return {
            participants: fixtureEdenMembersInGroup(
                electionRound,
                commonDelegate
            ),
            delegate: commonDelegate,
        };

    if (commonDelegate === CONSENSUS_RESULT_NO_DELEGATE) {
        // TODO: No Consensus scenario 2: Consider and test this further. I don't know that this works yet
        return {
            participants: [],
            delegate: "",
        };
    }
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

const ELECTION_DEFAULTS: Election = {
    areRoundsWithNoParticipation: false,
    completedRounds: [
        {
            participants: [],
            participantsMemberData: [],
        },
    ],
    ongoingRound: {
        participants: [],
        participantsMemberData: [],
    },
};

const getParticipantsOfCompletedRounds = async (myDelegation: EdenMember[]) => {
    const pCompletedRounds = myDelegation.map(async (member, electionRound) => {
        // get EdenMembers in group with this member
        const { queryKey, queryFn } = queryParticipantsInCompletedRound(
            electionRound,
            member
        );
        const edenMembers = await queryClient.fetchQuery(queryKey, queryFn);

        // get MemberDatas for these EdenMembers
        const pParticipantsMemberData = edenMembers?.participants.map(
            async (edenMember) => {
                const { queryKey, queryFn } = queryMemberData(
                    edenMember.account
                );
                const memberData = await queryClient.fetchQuery(
                    queryKey,
                    queryFn
                );
                return memberData;
            }
        );
        const participantsMemberData = await Promise.all(
            pParticipantsMemberData!
        );

        return {
            participants: edenMembers?.participants, // .length will be number of participants and empty if no round happened
            participantsMemberData,
            didReachConsensus: isValidDelegate(
                edenMembers?.participants?.[0]?.representative
            ),
        };
    });
    const completedRounds = await Promise.all(pCompletedRounds);
    return completedRounds;
};

export const getOngoingElectionData = async (
    memberStats?: MemberStats,
    votingMemberData: MemberData[] = [],
    currentElection?: CurrentElection,
    myDelegation: EdenMember[] = []
) => {
    if (!votingMemberData) throw new Error("no votingMemberData");

    // Calculate highestRoundIndexInWhichMemberWasRepresented and areRoundsWithNoParticipation
    const inSortitionRound =
        currentElection?.electionState === ElectionStatus.Final; // status===final only during sortition round
    // TODO: do we need currentElection.electionState === ElectionStatus.Active?
    const roundsCompleted = memberStats ? memberStats?.ranks.length : 0;
    const heightOfDelegationMinusChiefs = inSortitionRound
        ? roundsCompleted
        : myDelegation.length;

    // START calculating values needed for return value
    // highestRoundIndex = myDelegation.length - 1
    const highestRoundIndexInWhichMemberWasRepresented: number =
        heightOfDelegationMinusChiefs - 1;
    // areRoundsWithNoParticipation = myDelegation.length < memberStats.ranks.length
    const areRoundsWithNoParticipation =
        heightOfDelegationMinusChiefs < (memberStats?.ranks?.length || 0);

    // Ongoing Round info: this is unfiltered/unmodified vote table data.
    // This can be refactored to be more tailored to the frontend eventually.
    const ongoingRound = { participantsMemberData: votingMemberData };

    const completedRounds = await getParticipantsOfCompletedRounds(
        myDelegation
    );

    const electionData: Election = {
        ...ELECTION_DEFAULTS,
        highestRoundIndexInWhichMemberWasRepresented, //: 2,
        areRoundsWithNoParticipation, // : false,
        completedRounds,
        ongoingRound,
    } as Election;
    if (!electionData) return ELECTION_DEFAULTS;
    // electionData.areRoundsWithNoParticipation =
    //     electionData.completedRounds!.length > 1 &&
    //     electionData.highestRoundIndexInWhichMemberWasRepresented! <
    //         electionData.completedRounds!.length - 1;
    return electionData;
};
