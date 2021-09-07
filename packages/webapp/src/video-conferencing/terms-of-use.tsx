import { Container, Text } from "_app/ui";

export const ZoomTermsOfUse = () => {
    return (
        <Container className="space-y-2.5">
            <Text>
                By using the EdenOS Genesis app integration with Zoom, you
                understand that the EdenOS software will schedule meetings on
                your behalf (but specifically and only when you request that a
                meeting be created). The resulting meeting link/URL will be
                encrypted and distributed to your election meeting
                co-participants. And you accept that.
            </Text>
        </Container>
    );
};

export default ZoomTermsOfUse;
