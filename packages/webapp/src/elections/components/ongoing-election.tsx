import { FluidLayout } from "_app";
import { useCurrentElection } from "_app/hooks/queries";
import { Container, Heading, Text } from "_app/ui";
import { EncryptionPasswordAlert } from "encryption";

import * as Ongoing from "./ongoing-election-components";

// TODO: Hook up to real/fixture data; break apart and organize
// TODO: Make sure time zone changes during election are handled properly
export const OngoingElection = () => {
    const { data: currentElection } = useCurrentElection();

    return (
        <FluidLayout title="Election">
            <div className="divide-y">
                <EncryptionPasswordAlert promptSetupEncryptionKey />
                <Container>
                    <Heading size={1}>Election</Heading>
                </Container>
                <Container darkBg>
                    <Heading size={2}>Today's Election</Heading>
                    <Text>In progress until 6:30pm EDT</Text>
                </Container>
                <Ongoing.SupportSegment />
                {/* TODO: How do we get previous round info? Do that here. */}
                {currentElection?.round &&
                    [...Array(currentElection.round - 1)].map((_, i) => (
                        <Ongoing.CompletedRoundSegment
                            key={`election-round-${i + 1}`}
                            round={i + 1}
                        />
                    ))}
                {currentElection && (
                    <Ongoing.OngoingRoundSegment roundData={currentElection} />
                )}
            </div>
        </FluidLayout>
    );
};

export default OngoingElection;
