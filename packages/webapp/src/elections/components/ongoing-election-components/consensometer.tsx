import { GiCheckeredFlag } from "react-icons/gi";
// import { FaFlagCheckered } from "react-icons/fa";

import { VoteData } from "elections/interfaces";

interface Props {
    voteData: VoteData[];
}

// TODO: Decide on flag icon and black/white color options
// TODO: Improve naming of variables below. Consider adding comments.
// TODO: Should the flag disappear when you hae enough votes but the leader isn't voting for themselves (no consensus)?
// TODO: What displays when there are no votes?
const tallyVotes = (participantVoteData: VoteData[]) => {
    const votes = participantVoteData.filter((vd) => vd.candidate);
    const threshold = Math.floor(votes.length * (2 / 3) + 1);

    const voteRecipients = new Set(
        participantVoteData.map((v) => v.candidate).filter((c) => c)
    );

    const candidatesByVotesReceived: { [key: number]: string[] } = {};

    Array.from(voteRecipients).forEach((candidate) => {
        const numberOfVotesReceived = participantVoteData.filter(
            (vote) => vote.candidate === candidate
        ).length;
        if (candidatesByVotesReceived[numberOfVotesReceived]) {
            candidatesByVotesReceived[numberOfVotesReceived].push(candidate);
        } else {
            candidatesByVotesReceived[numberOfVotesReceived] = [candidate];
        }
    });

    const mostVotesCastForOneCandidate = Object.keys(candidatesByVotesReceived)
        .length
        ? Math.max(...Object.keys(candidatesByVotesReceived).map(Number))
        : 0;

    const candidatesWithMostVotes =
        candidatesByVotesReceived[mostVotesCastForOneCandidate] ?? [];

    const leaderIsVotingForSelf = Boolean(
        candidatesWithMostVotes.length === 1 &&
            participantVoteData.find(
                (participant) =>
                    participant.member === candidatesWithMostVotes[0] &&
                    participant.candidate === candidatesWithMostVotes[0]
            )
    );

    const didReachConsensus =
        mostVotesCastForOneCandidate >= threshold && leaderIsVotingForSelf;

    return {
        totalVotesCast: votes.length,
        leadCandidates: candidatesWithMostVotes,
        mostVotesCastForOneCandidate,
        votesRequiredForConsensus: threshold,
        isThereConsensus: didReachConsensus,
    };
};

export const Consensometer = ({ voteData }: Props) => {
    const testVotes = [
        {
            member: "edenmember11",
            round: 1,
            index: 0,
            candidate: "edenmember13",
        },
        {
            member: "egeon.edev",
            round: 1,
            index: 0,
            candidate: "edenmember13",
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
            candidate: "edenmember13",
        },
        {
            member: "edenmember15",
            round: 1,
            index: 0,
            candidate: "edenmember13",
        },
    ];

    const {
        totalVotesCast,
        mostVotesCastForOneCandidate,
        votesRequiredForConsensus,
        isThereConsensus,
    } = tallyVotes(voteData);

    return (
        <div className="flex space-x-1">
            {Array.from({ length: totalVotesCast }).map((_, i) => {
                let color = "bg-gray-300";
                if (i + 1 <= mostVotesCastForOneCandidate && isThereConsensus) {
                    color = "bg-green-500";
                } else if (i + 1 <= mostVotesCastForOneCandidate) {
                    color = "bg-blue-500";
                }
                return (
                    <div
                        key={"consensometer - " + i}
                        className={`flex justify-center items-center w-9 h-5 rounded ${color}`}
                    >
                        {i + 1 === votesRequiredForConsensus && (
                            <GiCheckeredFlag
                                size={16}
                                color={
                                    mostVotesCastForOneCandidate >=
                                    votesRequiredForConsensus
                                        ? "white"
                                        : "black"
                                }
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Consensometer;
