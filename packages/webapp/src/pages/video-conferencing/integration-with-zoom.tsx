import { SideNavLayout } from "_app";
import { Container, Heading, Link, Text } from "_app/ui";
import { ZoomCompliance } from "video-conferencing";

export const ZoomCompliancePage = () => {
    return (
        <SideNavLayout
            title="Video conferencing"
            className="divide-y border-b mb-20"
        >
            <Container>
                <Heading size={1}>Video conferencing for EdenOS</Heading>
            </Container>
            <Container>
                <Text>
                    The EdenOS software integrates with{" "}
                    <Link href="https://zoom.us" target="_blank" isExternal>
                        Zoom
                    </Link>{" "}
                    for running video conferences for fractal governance
                    elections. Below, you'll find important information relating
                    to that integration.
                </Text>
            </Container>
            <ZoomCompliance />
        </SideNavLayout>
    );
};

export default ZoomCompliancePage;
