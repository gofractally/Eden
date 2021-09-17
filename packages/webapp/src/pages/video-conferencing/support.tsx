import { SideNavLayout } from "_app";
import { Container, Heading } from "_app/ui";
import { ZoomIntroduction, ZoomSupport } from "video-conferencing";

export const Support = () => {
    return (
        <SideNavLayout
            title="Support | Video Conferencing"
            className="divide-y border-b mb-20"
        >
            <Container>
                <Heading size={1}>Support</Heading>
            </Container>
            <Container>
                <ZoomIntroduction />
            </Container>
            <ZoomSupport />
        </SideNavLayout>
    );
};

export default Support;
