import { useCurrentElection } from "_app";
import { Container, Heading, Text } from "_app/ui";

import * as Ongoing from "./ongoing-election-components";

// TODO: Hook up to real/fixture data; break apart and organize
// TODO: Make sure time zone changes during election are handled properly
export const OngoingElection = () => {
    const { data: currentElection } = useCurrentElection();

    return (
        <div className="divide-y">
            <Container darkBg>
                <Heading size={2}>Today's Election</Heading>
                <Text>In progress until 6:30pm EDT</Text>
            </Container>
            <Ongoing.SupportSegment />
            {/* TODO: How do we get previous round info? Do that here. */}
            {currentElection?.round > 0 &&
                [...Array(currentElection.round)].map((_, i) => (
                    <Ongoing.CompletedRoundSegment
                        key={`election-round-${i + 1}`}
                        round={i + 1}
                    />
                ))}
            {currentElection && (
                <Ongoing.OngoingRoundSegment roundData={currentElection} />
            )}
        </div>
    );
};

export default OngoingElection;
