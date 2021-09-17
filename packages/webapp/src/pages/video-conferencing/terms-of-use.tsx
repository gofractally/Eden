import { SideNavLayout } from "_app";
import { Container, Heading } from "_app/ui";
import { ZoomIntroduction, ZoomTermsOfUse } from "video-conferencing";

export const TermsOfUse = () => {
    return (
        <SideNavLayout
            title="Terms of Use | Video Conferencing"
            className="divide-y border-b mb-20"
        >
            <Container>
                <Heading size={1}>Terms of use</Heading>
            </Container>
            <Container>
                <ZoomIntroduction />
            </Container>
            <ZoomTermsOfUse />
        </SideNavLayout>
    );
};

export default TermsOfUse;
