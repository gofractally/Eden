import { useCurrentElection, useMemberStats } from "_app";
import { Container, Heading, Text } from "_app/ui";
import { ElectionRoundData, ElectionStatus } from "elections/interfaces";

import * as Ongoing from "./ongoing-election-components";

// TODO: Make sure time zone changes during election are handled properly
export const OngoingElection = () => {
    const { data: currentElection } = useCurrentElection();
    const { data: memberStats } = useMemberStats();

    if (!currentElection || !memberStats) {
        return (
            <Container>
                <Heading size={2}>Loading</Heading>
            </Container>
        );
    }

    let roundData = currentElection as ElectionRoundData;
    if (currentElection?.electionState === ElectionStatus.Final) {
        roundData = {
            electionState: currentElection?.electionState,
            round: memberStats?.ranks.length,
            // TODO: Reduce time for sortition round to two hours in contract
            round_end: currentElection?.seed.end_time,
        };
    }

    return (
        <div className="divide-y">
            <Container darkBg>
                <Heading size={2}>Today's Election</Heading>
                <Text>In progress until 6:30pm EDT</Text>
            </Container>
            <Ongoing.SupportSegment />
            {/* TODO: How do we get previous round info for rounds that didn't come to consensus? Do that here. */}
            {roundData?.round > 0 &&
                [...Array(roundData.round)].map((_, i) => (
                    <Ongoing.CompletedRoundSegment
                        key={`election-round-${i + 1}`}
                        roundIndex={i}
                    />
                ))}
            {currentElection?.electionState === ElectionStatus.Final ? (
                <Ongoing.ChiefsRoundSegment
                    roundIndex={roundData.round}
                    roundEndTime={roundData.round_end}
                />
            ) : (
                <Ongoing.OngoingRoundSegment
                    electionState={roundData.electionState}
                    roundIndex={roundData.round}
                    roundEndTime={roundData.round_end}
                    electionConfig={roundData.config}
                />
            )}
        </div>
    );
};

export default OngoingElection;
