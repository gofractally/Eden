import { Container, Text } from "_app/ui";

export const ZoomTermsOfUse = () => {
    return (
        <Container className="space-y-2.5">
            <Text>
                By using the EdenOS Genesis app integration with Zoom, you
                understand and accept that the EdenOS software will schedule
                meetings on your behalf (but specifically and only when you
                request that a meeting be created) and will invite your election
                meeting co-participants to join and participate in those
                meetings.
            </Text>
        </Container>
    );
};

export default ZoomTermsOfUse;
