import React from "react";

import { useElectionState } from "_app";
import { Button, Container, Heading, LoadingContainer, Text } from "_app/ui";
import { ROUTES } from "_app/routes";

export const ViewPreviousElectionResultsCTA = () => {
    const { data: electionState, isLoading } = useElectionState();

    if (isLoading) return <LoadingContainer />;
    if (!electionState?.last_election_time) return null;

    return (
        <Container className="space-y-2.5">
            <Heading size={3}>Previous election results</Heading>
            <Text>
                See the results of the last election, including round
                participants, elected delegates, uploaded videos, and more.
            </Text>
            <Button
                size="xs"
                href={ROUTES.ELECTION_STATS.href}
                title="See results of previous election"
            >
                See results
            </Button>
        </Container>
    );
};

export default ViewPreviousElectionResultsCTA;
