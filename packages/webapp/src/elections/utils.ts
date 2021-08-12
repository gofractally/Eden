import dayjs from "dayjs";

import { VoteData } from "elections/interfaces";

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

export const tallyVotesFromVoteData = (participantVoteData: VoteData[]) => {
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
