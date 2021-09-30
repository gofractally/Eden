import React from "react";
import { Container, Heading, Text } from "_app/ui";
import { MemberGateContainer } from "members";

export const ErrorLoadingDelegation = () => (
    <Container className="flex flex-col justify-center items-center py-16 text-center">
        <Heading size={4}>Error loading delegation information</Heading>
        <Text>Please reload the page to try again.</Text>
    </Container>
);

export const ElectionInProgress = () => (
    <Container className="flex flex-col justify-center items-center py-16 text-center">
        <Heading size={4}>Election in progress</Heading>
        <Text>
            Come back after the election is complete to see your delegation.
        </Text>
    </Container>
);

export const NoDelegationToDisplay = () => (
    <Container className="flex flex-col justify-center items-center py-16 text-center">
        <Heading size={4}>No delegation to display</Heading>
        <MemberGateContainer>
            <Text>
                Your delegation will appear here after the first election
                completes.
            </Text>
        </MemberGateContainer>
    </Container>
);
