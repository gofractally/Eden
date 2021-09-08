import { Container, Link, Text } from "_app/ui";

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
            <Text>
                More widely, your membership in the Eden community and your use
                of the EdenOS software is voluntary and subject to the terms of
                the{" "}
                <Link
                    href="https://www.notion.so/edenos/Eden-Peace-Treaty-5b15633ca09c4c6495a5b60f7bc92db2"
                    target="_blank"
                    isExternal
                >
                    Eden Peace Treaty and Bylaws
                </Link>
                .{" "}
            </Text>
        </Container>
    );
};

export default ZoomTermsOfUse;
