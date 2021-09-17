import { SideNavLayout } from "_app";
import { Container, Heading } from "_app/ui";
import { ZoomIntroduction, ZoomPrivacyPolicy } from "video-conferencing";

export const PrivacyPolicy = () => {
    return (
        <SideNavLayout
            title="Privacy Policy | Video Conferencing"
            className="divide-y border-b mb-20"
        >
            <Container>
                <Heading size={1}>Privacy policy</Heading>
            </Container>
            <Container>
                <ZoomIntroduction />
            </Container>
            <ZoomPrivacyPolicy />
        </SideNavLayout>
    );
};

export default PrivacyPolicy;
