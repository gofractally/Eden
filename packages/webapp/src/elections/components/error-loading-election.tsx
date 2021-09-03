import { Container, Heading, Text } from "_app/ui";

export const ErrorLoadingElection = () => (
    <Container className="flex flex-col justify-center items-center py-16">
        <Heading size={4}>Error loading election information</Heading>
        <Text>Please reload the page to try again.</Text>
    </Container>
);

export default ErrorLoadingElection;
