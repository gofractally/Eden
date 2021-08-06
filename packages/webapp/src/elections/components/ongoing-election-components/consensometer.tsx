import { GiCheckeredFlag } from "react-icons/gi";
import { FaStar } from "react-icons/fa";

import { VoteData } from "elections/interfaces";

interface Props {
    voteData: VoteData[];
}

// TODO: What displays when there are no votes?
const tallyVotes = (participantVoteData: VoteData[]) => {
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
        votesRequiredForConsensus: threshold,
        leaderIsVotingForSelf,
        isThereConsensus: didReachConsensus,
    };
};

export const Consensometer = ({ voteData }: Props) => {
    const testVotes = [
        {
            member: "edenmember11",
            round: 1,
            index: 0,
            candidate: "edenmember11",
        },
        {
            member: "egeon.edev",
            round: 1,
            index: 0,
            candidate: "edenmember11",
        },
        {
            member: "edenmember13",
            round: 1,
            index: 0,
            candidate: "edenmember11",
        },
        {
            member: "edenmember14",
            round: 1,
            index: 0,
            candidate: "edenmember11",
        },
        {
            member: "edenmember15",
            round: 1,
            index: 0,
            candidate: "edenmember11",
        },
    ];

    const {
        totalVotesCast,
        leadTally,
        votesRequiredForConsensus,
        leaderIsVotingForSelf,
        isThereConsensus,
    } = tallyVotes(voteData);

    return (
        <div className="flex space-x-1">
            {Array.from({ length: totalVotesCast }).map((_, i) => {
                let thisBlock = i + 1;
                let color = "bg-gray-300";

                // Blocks represent votes cast
                // Number of blue blocks represents votes cast for leading candidate(s)
                // Green blocks are votes cast for the leading candidate once consensus is reached
                // Finish line/flag block represents number of votes required to reach consensus
                // Finish line/flag block is skipped if number of votes to reach consensus is attained but lead candidate is not voting for themself

                if (leaderIsVotingForSelf) {
                    if (thisBlock <= leadTally && isThereConsensus) {
                        color = "bg-green-500";
                    } else if (thisBlock <= leadTally) {
                        color = "bg-blue-500";
                    }
                } else if (thisBlock !== votesRequiredForConsensus) {
                    // apply blue blocks like before but skip/ignore the finish line block
                    if (thisBlock > votesRequiredForConsensus) {
                        thisBlock = i;
                    }
                    if (thisBlock <= leadTally) {
                        color = "bg-blue-500";
                    }
                }

                return (
                    <div
                        key={"consensometer - " + i}
                        className={`flex justify-center items-center w-9 h-5 rounded ${color}`}
                    >
                        {i + 1 === votesRequiredForConsensus && (
                            <GiCheckeredFlag // TODO: becomes gold star when filled?
                                size={16}
                                color={
                                    leadTally >= votesRequiredForConsensus
                                        ? "white" // TODO: white only on blue
                                        : "black"
                                }
                            />
                        )}
                        {/* TODO: add explainer text */}
                    </div>
                );
            })}
        </div>
    );
};

export default Consensometer;
