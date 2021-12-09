import React from "react";
import dayjs from "dayjs";

import { useElectionState } from "_app";
import { Button, Container, Heading, LoadingContainer, Text } from "_app/ui";
import { ROUTES } from "_app/routes";

export const ElectionVideoUploadCTA = () => {
    const { data: electionState, isLoading } = useElectionState();

    if (isLoading) return <LoadingContainer />;
    if (!electionState?.last_election_time) return null;

    const deadline = dayjs(electionState?.last_election_time + "Z").add(
        2,
        "weeks"
    );

    if (dayjs().isAfter(deadline)) return null;

    return (
        <Container className="space-y-2.5">
            <Heading size={3}>Election video upload service</Heading>
            <Text>
                View and upload your meeting videos from the last election. All
                election videos must be uploaded by {deadline.format("LLL z")}.
            </Text>
            <Button
                size="xs"
                href={ROUTES.ELECTION_SLASH_ROUND_VIDEO_UPLOAD.href}
                title="Election video upload service"
            >
                Go now
            </Button>
        </Container>
    );
};

export default ElectionVideoUploadCTA;
