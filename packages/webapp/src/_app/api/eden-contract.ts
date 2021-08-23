import { EdenMember } from "members";
import { CONTRACT_GLOBAL_TABLE, getTableRows } from "_app";
import { ElectionParticipationStatus } from "./interfaces";

// check that member has participated in an election (if there's been one yet) (!="zzz...") and came to consensus with their group in the last election (!=0)
const MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION =
    "zzzzzzzzzzzzj";
// groups that didn't come to consensus will be assigned an invalid-EOS-account value for representative
// that's shared among group members (so you can still determine them to have been in the same group).
// These non-rep values, since they're stored in the `representative` field
// will be distinguishable by the fact that they're 13 characters long, making them invalid EOS account names
export const didReachConsensus = (
    rankIndex: number,
    edenMembersInGroup?: EdenMember[]
) => {
    if (!edenMembersInGroup) return false;
    return edenMembersInGroup.some(
        (m) =>
            m.election_rank === rankIndex && isValidDelegate(m.representative)
    );
};

const isResultFromNoConsensus = (representativeValue?: string) =>
    representativeValue !==
        MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION &&
    representativeValue?.length === 13;

export const isValidDelegate = (memberRep?: string) =>
    memberRep &&
    memberRep !==
        MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION &&
    !isResultFromNoConsensus(memberRep);

/**
 * This will tell you, during an election, if the member you pass in is not
 * participating and did not participate at all in the current, ongoing election
 * (i.e., never opted in to participate.) We first check whether their representative
 * field value is the magic value for a member who has never completed an election,
 * and then we check to make sure their participation status is 0 (NotInElection) to
 * differentiate them from first-time participants in the current ongoing election.
 * @param {EdenMember} member - The member you're checking
 * @returns {boolean}
 */
export const isNonParticipantInOngoingElection = (member: EdenMember) =>
    member.representative ===
        MEMBER_REPRESENTATIVE_IF_NOT_PARTICIPATED_IN_RECENT_ELECTION &&
    member.election_participation_status ===
        ElectionParticipationStatus.NotInElection;

export const getCommunityGlobals = async () => {
    const rows = await getTableRows(CONTRACT_GLOBAL_TABLE, {
        lowerBound: "community",
    });
    return rows?.[0];
};
