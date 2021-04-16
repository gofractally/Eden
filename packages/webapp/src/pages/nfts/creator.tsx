import { withUAL } from "ual-reactjs-renderer";

import { RawLayout } from "_app";
import { CreatorForm } from "nfts";

const CreatorUalForm = withUAL(CreatorForm);

export const MembersCreatorPage = () => {
    return (
        <RawLayout title="NFT Creator">
            <CreatorUalForm />
        </RawLayout>
    );
};

export default MembersCreatorPage;
