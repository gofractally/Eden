import { UALProvider, withUAL } from "ual-reactjs-renderer";

import { ClientOnly, RawLayout } from "_app";
import { anchor, appName, chainConfig, CreatorForm } from "nfts";

const CreatorUalForm = withUAL(CreatorForm);

export const MembersCreatorPage = () => {
    return (
        <RawLayout title="NFT Creator">
            <ClientOnly>
                <UALProvider
                    chains={[chainConfig]}
                    authenticators={[anchor]}
                    appName={appName}
                >
                    <CreatorUalForm />
                </UALProvider>
            </ClientOnly>
        </RawLayout>
    );
};

export default MembersCreatorPage;
