import * as eosjsSerialize from "eosjs/dist/eosjs-serialize";
import * as eosjsNumeric from "eosjs/dist/eosjs-numeric";

import { devUseFixtureData } from "config";
import { queryClient } from "pages/_app";
import {
    CONTRACT_CURRENT_ELECTION_TABLE,
    CONTRACT_ELECTION_STATE_TABLE,
    CONTRACT_MEMBER_TABLE,
    CONTRACT_VOTE_TABLE,
    didReachConsensus,
    ElectionParticipationStatus,
    getRow,
    getTableRawRows,
    getTableRows,
    INDEX_MEMBER_BY_REP,
    INDEX_VOTE_BY_GROUP_INDEX,
    isNonParticipantInOngoingElection,
    isValidDelegate,
    queryMemberByAccountName,
    queryMembers,
    queryParticipantsInCompletedRound,
    TABLE_INDEXES,
} from "_app";
import { EdenMember, VoteDataQueryOptionsByField } from "members";
import { MemberNFT } from "nfts/interfaces";
import {
    ActiveStateConfigType,
    CONFIG_SORTITION_ROUND_DEFAULTS,
    CurrentElection,
    Election,
    ElectionCompletedRound,
    ElectionState,
    ElectionStatus,
    VoteData,
} from "elections/interfaces";
import {
    fixtureCurrentElection,
    fixtureElectionState,
    fixtureVoteDataRow,
    fixtureVoteDataRows,
    fixtureRegistrationElection,
} from "./fixtures";

const COMMON_DELEGATE_OF_NO_ROUND = "no round";
import { TableQueryOptions } from "_app/eos/interfaces";
import {
    fixtureEdenMembers,
    fixtureEdenMembersInGroup,
} from "members/api/fixtures";

export const getMemberGroupFromIndex = (
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
    roundIndex?: number,
    config: ActiveStateConfigType = CONFIG_SORTITION_ROUND_DEFAULTS
) => {
    if (roundIndex === undefined)
        throw new Error(
            "getMemberGroupParticipants requires a roundIndex (got 'undefined')"
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
    const rows = await getVoteDataRows({
        lowerBound: (roundIndex << 16) + lowerBound,
        upperBound: (roundIndex << 16) + upperBound,
        limit: GET_VOTE_DATA_ROWS_LIMIT,
        ...TABLE_INDEXES[CONTRACT_VOTE_TABLE][INDEX_VOTE_BY_GROUP_INDEX],
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
    opts: TableQueryOptions
): Promise<VoteData[] | undefined> => {
    if (devUseFixtureData)
        return Promise.resolve(
            fixtureVoteDataRows.filter(
                (vote) =>
                    vote.index >= opts.lowerBound! &&
                    vote.index <= opts.upperBound!
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
    roundIndexRequested: number,
    member: EdenMember,
    voteData?: VoteData
) => {
    let electionRankIndex = member.election_rank; // if member table has been updated for this election
    // if the member has an open voteData record (i.e., still participating), get their election rank from that
    if (voteData?.member === member.account) {
        electionRankIndex = voteData.round;
    }

    let commonDelegate = member.representative;
    if (electionRankIndex > roundIndexRequested) {
        commonDelegate = member.account;
    } else if (electionRankIndex < roundIndexRequested) {
        // No Consensus Scenario 2: this member was in Round 1, which didn't reach consensus, and we're asking about Round 2 for them, which never happened
        return COMMON_DELEGATE_OF_NO_ROUND;
    }

    // No Consensus Scenario 1: requestedRound === electionRankIndex.
    // We'll get a commonDelegate; it just won't be a delegate, it'll be a group identifier
    return commonDelegate;
};

/**
 * Get round participants and any delegate-elect for the given member's completed election round at the given round index during an ongoing election.
 * @param {number} electionRoundIndex
 * @param {EdenMember} member
 * @param {VoteData} voteData - optional and not present for a member who is no longer participating
 * @returns {ElectionCompletedRound} - participant EdenMembers and the delegate-elect, if any, for the member's completed election round
 */
export const getParticipantsInCompletedRound = async (
    electionRoundIndex: number,
    member: EdenMember,
    voteData?: VoteData
): Promise<ElectionCompletedRound> => {
    // TODO: Add no-consensus scenario to this function
    const commonDelegate = getCommonDelegateAccountForGroupWithThisMember(
        electionRoundIndex,
        member,
        voteData
    );

    if (devUseFixtureData)
        return {
            participants: fixtureEdenMembersInGroup(
                electionRoundIndex,
                commonDelegate
            ),
            delegate: fixtureEdenMembers.find(
                (m) => m.account === commonDelegate
            ),
        } as ElectionCompletedRound;

    if (commonDelegate === COMMON_DELEGATE_OF_NO_ROUND) {
        // TODO: No Consensus scenario 2: Consider and test this further. I don't know that this works yet
        return {
            participants: [],
        } as ElectionCompletedRound;
    }
    const serialBuffer = new eosjsSerialize.SerialBuffer();
    serialBuffer.pushName(commonDelegate);
    serialBuffer.pushNumberAsUint64(electionRoundIndex);

    const bytes = serialBuffer.getUint8Array(16);
    const bounds: string = eosjsNumeric.signedBinaryToDecimal(bytes).toString();

    const participants = (
        await getTableRows(CONTRACT_MEMBER_TABLE, {
            lowerBound: bounds,
            upperBound: bounds,
            limit: 20,
            ...TABLE_INDEXES[CONTRACT_MEMBER_TABLE][INDEX_MEMBER_BY_REP],
        })
    ).filter(
        // we want to filter out 1) members who never opted in to this election as well as
        // members who are still participating in the election.
        // The follow code handles #1 obviously but handles #2 by virtue of members' participation status
        // being updated to NotInElection as soon as the "lose" an election
        // So since we're building only *completed* rounds here,
        // all members we're interested in will be no longer participating in the election,
        // except (potentially) for the delegate that got voted up.
        (p) =>
            p.election_participation_status !==
            ElectionParticipationStatus.InElection // So this could read status === participationCompleted
    );

    const delegateAccountName = participants?.[0]?.representative;
    if (!isValidDelegate(delegateAccountName)) return { participants };

    const { queryKey, queryFn } = queryMemberByAccountName(delegateAccountName);
    const delegate = await queryClient.fetchQuery(queryKey, queryFn);
    return {
        participants: [delegate, ...participants],
        delegate: delegate,
    };
};

export const getCurrentElection = async () => {
    // 1. When testing Registration phase
    if (devUseFixtureData) return fixtureRegistrationElection;

    // 2. When testing Current election phase
    if (devUseFixtureData) return fixtureCurrentElection;

    const rawRows = await getTableRawRows<any>(CONTRACT_CURRENT_ELECTION_TABLE);
    const electionState = convertElectionState(rawRows[0][0]);

    const rows = rawRows.map((row) => row[1]);

    if (!rows.length) {
        return undefined;
    }

    return { electionState, ...rows[0] };
};

const convertElectionState = (variantName: string) => {
    switch (variantName) {
        case "current_election_state_registration_v0":
        case "current_election_state_registration_v1":
            return "current_election_state_registration";
        case "current_election_state_seeding_v0":
        case "current_election_state_seeding_v1":
            return "current_election_state_seeding";
        case "current_election_state_init_voters_v0":
        case "current_election_state_init_voters_v1":
            return "current_election_state_init_voters";
        default:
            return variantName;
    }
};

export const getElectionState = async () => {
    if (devUseFixtureData) return fixtureElectionState;

    return await getRow<ElectionState>(CONTRACT_ELECTION_STATE_TABLE);
};

const ELECTION_DEFAULTS: Election = {
    isMemberStillParticipating: false,
    isElectionOngoing: false,
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

const getMemberDataFromEdenMemberList = async (memberList: EdenMember[]) => {
    const nftTemplateIds = memberList.map((em) => em.nft_template_id);

    const { queryKey, queryFn } = queryMembers(
        1,
        nftTemplateIds.length,
        nftTemplateIds
    );

    return await queryClient.fetchQuery<MemberNFT[], Error>(queryKey, queryFn, {
        staleTime: Infinity,
    });
};
const getParticipantsOfCompletedRounds = async (myDelegation: EdenMember[]) => {
    const pCompletedRounds = myDelegation.map(
        async (member, electionRoundIndex) => {
            // get EdenMembers in group with this member
            const { queryKey, queryFn } = queryParticipantsInCompletedRound(
                electionRoundIndex,
                member
            );
            const edenMembersInThisRound = await queryClient.fetchQuery(
                queryKey,
                queryFn
            );

            const participantsMemberData = await getMemberDataFromEdenMemberList(
                edenMembersInThisRound?.participants || []
            );

            const commonDelegate = edenMembersInThisRound?.participants.find(
                (m) => m.representative !== member.account
            );
            const bDidReachConsensus = didReachConsensus(
                electionRoundIndex,
                edenMembersInThisRound?.participants
            );

            return {
                participants: edenMembersInThisRound?.participants, // .length will be number of participants and empty if no round happened
                participantsMemberData,
                didReachConsensus: bDidReachConsensus,
                delegate: bDidReachConsensus && commonDelegate,
            };
        }
    );
    const completedRounds = await Promise.all(pCompletedRounds);
    return completedRounds;
};

/**
 * get an abstracted view of the election data
 * Goal: Model all this data to be self-consistent and to abstract the frontend from the complexities of the backend logic
 * Ongoing Round info: this is unfiltered/unmodified vote table data.
 * Ongoing Round info can be refactored to be more tailored to the frontend eventually.
 * @param {string} title - The title of the book.
 * @param {string} author - The author of the book.
 */
export const getOngoingElectionData = async (
    votingMemberData: MemberNFT[] = [],
    currentElection?: CurrentElection,
    myDelegation: EdenMember[] = [],
    loggedInMember?: EdenMember
) => {
    const isElectionOngoing =
        currentElection?.electionState === ElectionStatus.Active ||
        currentElection?.electionState === ElectionStatus.Final;
    const inSortitionRound =
        currentElection?.electionState === ElectionStatus.Final; // status===final only during sortition round

    const isMemberStillParticipating = votingMemberData.length > 0;

    const ongoingRound = {
        participantsMemberData: votingMemberData,
        roundIndex: isElectionOngoing ? myDelegation.length : undefined,
    };

    const completedRounds = await getParticipantsOfCompletedRounds(
        myDelegation
    );

    const isMemberOptedOut = loggedInMember
        ? isNonParticipantInOngoingElection(loggedInMember)
        : undefined;

    const electionData = {
        ...ELECTION_DEFAULTS,
        isElectionOngoing,
        isMemberStillParticipating,
        isMemberOptedOut,
        inSortitionRound,
        completedRounds,
        ongoingRound,
    } as Election;
    if (!electionData) return ELECTION_DEFAULTS;
    return electionData;
};
