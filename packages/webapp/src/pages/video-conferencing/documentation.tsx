import { SideNavLayout } from "_app";
import { Container, Heading } from "_app/ui";
import { ZoomDocumentation, ZoomIntroduction } from "video-conferencing";

export const Documentation = () => {
    return (
        <SideNavLayout
            title="Documentation | Video Conferencing"
            className="divide-y border-b mb-20"
        >
            <Container>
                <Heading size={1}>Documentation</Heading>
            </Container>
            <Container>
                <ZoomIntroduction />
            </Container>
            <ZoomDocumentation />
        </SideNavLayout>
    );
};

export default Documentation;
