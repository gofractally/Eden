import dayjs, { Dayjs } from "dayjs";

import { ActiveStateConfigType, SimpleVoteData } from "./interfaces";
import { getMemberGroupFromIndex } from "./api";

export const extractElectionDates = (election: any) => {
    const rawStartDateTime =
        (election?.election_seeder?.end_time ||
            election?.start_time ||
            election?.seed?.end_time) + "Z";

    if (!rawStartDateTime) {
        throw new Error("Error parsing the Election start date.");
    }

    const startDateTime = dayjs(rawStartDateTime);
    const participationTimeLimit = startDateTime.subtract(24, "hour");
    const estimatedEndDateTime = startDateTime.add(
        10, // TODO: estimate and calculate this value properly based on round numbers
        "hour"
    );

    return {
        startDateTime,
        participationTimeLimit,
        estimatedEndDateTime,
        rawStartDateTime,
    };
};

export const tallyVotesFromVoteData = (
    participantVoteData: SimpleVoteData[]
) => {
    const votes = participantVoteData.filter((pv) => pv.candidate);
    const threshold = Math.floor(votes.length * (2 / 3) + 1);

    const voteRecipients = new Set(
        participantVoteData.map((v) => v.candidate).filter((c) => c)
    );

    const candidatesByVotesReceived: { [key: number]: string[] } = {};
    Array.from(voteRecipients).forEach((candidate) => {
        const numVotesReceived = participantVoteData.filter(
            (vote) => vote.candidate === candidate
        ).length;
        if (candidatesByVotesReceived[numVotesReceived]) {
            candidatesByVotesReceived[numVotesReceived].push(candidate);
        } else {
            candidatesByVotesReceived[numVotesReceived] = [candidate];
        }
    });

    const leadTally = Object.keys(candidatesByVotesReceived).length
        ? Math.max(...Object.keys(candidatesByVotesReceived).map(Number))
        : 0;

    const candidatesWithMostVotes = candidatesByVotesReceived[leadTally] ?? [];
    const thereIsOneLeader = candidatesWithMostVotes.length === 1;

    const leaderIsVotingForSelf =
        thereIsOneLeader &&
        participantVoteData.some(
            (participant) =>
                participant.member === candidatesWithMostVotes[0] &&
                participant.candidate === candidatesWithMostVotes[0]
        );

    const didReachConsensus = leadTally >= threshold && leaderIsVotingForSelf;

    return {
        totalVotesCast: votes.length,
        leadCandidates: candidatesWithMostVotes,
        leadTally,
        totalVotesRequiredForConsensus: threshold,
        remainingVotesRequiredForConsensus: threshold - leadTally,
        leaderIsVotingForSelf,
        isThereConsensus: didReachConsensus,
    };
};

export const calculateGroupId = (
    round: number,
    voterIndex: number,
    config: ActiveStateConfigType
): string => {
    const totalParticipants = config.num_participants;
    const numGroups = config.num_groups;

    const { groupNumber } = getMemberGroupFromIndex(
        voterIndex,
        totalParticipants,
        numGroups
    );

    return `${(round << 16) | groupNumber}`;
};

export const getRoundTimes = (
    communityGlobals: any,
    currentElection: any
): {
    roundDurationMs: number;
    roundEndTime: Dayjs;
    roundStartTime: Dayjs;
} => {
    const roundDurationSec = communityGlobals.election_round_time_sec;
    const roundEndTimeRaw =
        currentElection.round_end ?? currentElection.seed.end_time;
    const roundDurationMs = roundDurationSec * 1000;
    const roundEndTime = dayjs(roundEndTimeRaw + "Z");
    return {
        roundDurationMs,
        roundEndTime,
        roundStartTime: dayjs(roundEndTime).subtract(roundDurationMs),
    };
};
