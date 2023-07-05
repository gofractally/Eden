import React from "react";
import { GiCheckeredFlag } from "react-icons/gi";
import { FaStar } from "react-icons/fa";

import { Heading, Text } from "_app/ui";
import { VoteData } from "elections/interfaces";
import { tallyVotesFromVoteData } from "elections/utils";

interface Props {
    voteData: VoteData[];
    className?: string;
}

export const Consensometer = ({ voteData, className = "" }: Props) => {
    // we could use fixtures, but inlining this means we see results without reloads
    // const testVotes = [
    //     {
    //         member: "edenmember11",
    //         round: 1,
    //         index: 0,
    //         candidate: "edenmember13",
    //     },
    //     {
    //         member: "egeon.edev",
    //         round: 1,
    //         index: 0,
    //         candidate: "edenmember13",
    //     },
    //     {
    //         member: "edenmember13",
    //         round: 1,
    //         index: 0,
    //         candidate: "edenmember13",
    //     },
    //     {
    //         member: "edenmember14",
    //         round: 1,
    //         index: 0,
    //         candidate: "edenmember13",
    //     },
    //     {
    //         member: "edenmember15",
    //         round: 1,
    //         index: 0,
    //         candidate: "edenmember14",
    //     },
    // ];

    const tally = tallyVotesFromVoteData(voteData);
    const {
        isThereConsensus,
        leadCandidates,
        leaderIsVotingForSelf,
        leadTally,
        totalVotesRequiredForConsensus,
        remainingVotesRequiredForConsensus,
    } = tally;

    let helpText = "Waiting for votes";
    if (isThereConsensus) {
        helpText = "Consensus reached";
    } else if (
        leadTally >= totalVotesRequiredForConsensus &&
        !leaderIsVotingForSelf
    ) {
        helpText = "Leader Candidates must vote for themselves";
    } else if (leadCandidates.length === 1) {
        helpText = `Leader needs ${
            remainingVotesRequiredForConsensus > 1
                ? `${remainingVotesRequiredForConsensus} more votes`
                : "another vote"
        }`;
    }

    return (
        <div className={`flex flex-col space-y-1 pt-1 ${className}`}>
            <div className="flex items-center space-x-3">
                <Heading size={4} className="inline-block">
                    Consensus
                </Heading>
                <ConsensometerBlocks tally={tally} voteData={voteData} />
            </div>
            <Text>{helpText}</Text>
        </div>
    );
};

export default Consensometer;

interface ConsensometerBlocksProps {
    voteData: VoteData[];
    tally?: ReturnType<typeof tallyVotesFromVoteData>;
    className?: string;
}

export const ConsensometerBlocks = ({
    voteData,
    tally,
    className = "",
}: ConsensometerBlocksProps) => {
    const tallies = tally ?? tallyVotesFromVoteData(voteData);
    const {
        isThereConsensus,
        leaderIsVotingForSelf,
        leadTally,
        totalVotesCast,
        totalVotesRequiredForConsensus,
    } = tallies;
    return (
        <div className={`flex space-x-1 ${className}`}>
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
                        color = "bg-green-400";
                    } else if (thisBlock <= leadTally) {
                        color = "bg-blue-400";
                    }
                } else if (thisBlock !== totalVotesRequiredForConsensus) {
                    // apply blue blocks like before but skip/ignore the finish line block
                    if (thisBlock > totalVotesRequiredForConsensus) {
                        thisBlock = i;
                    }
                    if (thisBlock <= leadTally) {
                        color = "bg-blue-400";
                    }
                }

                return (
                    <div
                        key={"consensometer - " + i}
                        className={`flex justify-center items-center w-9 h-5 rounded ${color}`}
                    >
                        {i + 1 === totalVotesRequiredForConsensus &&
                            (isThereConsensus ? (
                                <FaStar size={14} className="text-white" />
                            ) : (
                                <GiCheckeredFlag size={16} color="black" />
                            ))}
                    </div>
                );
            })}
        </div>
    );
};
