import { Expander, Heading } from "_app/ui";

import {
    ZoomDocumentation,
    ZoomPrivacyPolicy,
    ZoomSupport,
    ZoomTermsOfUse,
} from "video-conferencing";

export const ZoomCompliance = () => {
    return (
        <>
            <Expander
                showContentDivider
                header={<Heading size={3}>Privacy policy</Heading>}
            >
                <ZoomPrivacyPolicy />
            </Expander>
            <Expander
                showContentDivider
                header={<Heading size={3}>Terms of use</Heading>}
            >
                <ZoomTermsOfUse />
            </Expander>
            <Expander
                showContentDivider
                header={<Heading size={3}>Documentation</Heading>}
            >
                <ZoomDocumentation />
            </Expander>
            <Expander
                showContentDivider
                header={<Heading size={3}>Support</Heading>}
            >
                <ZoomSupport />
            </Expander>
        </>
    );
};

export default ZoomCompliance;
