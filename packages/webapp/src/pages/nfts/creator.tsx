import { UALProvider, withUAL } from "ual-reactjs-renderer";

import { ClientOnly, SingleColLayout } from "_app";
import { anchor, appName, chainConfig, CreatorForm } from "nfts";

const CreatorUalForm = withUAL(CreatorForm);

export const MembersCreatorPage = () => {
    return (
        <SingleColLayout title="NFT Creator">
            <ClientOnly>
                <UALProvider
                    chains={[chainConfig]}
                    authenticators={[anchor]}
                    appName={appName}
                >
                    <CreatorUalForm />
                </UALProvider>
            </ClientOnly>
        </SingleColLayout>
    );
};

export default MembersCreatorPage;
