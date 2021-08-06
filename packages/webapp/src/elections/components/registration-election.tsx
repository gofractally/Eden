import { FluidLayout } from "_app";
import { EncryptionPasswordAlert } from "encryption";

import { ParticipationCard } from "./registration-election-components";

export const RegistrationElection = () => {
    return (
        <FluidLayout title="Election">
            <div className="divide-y">
                <EncryptionPasswordAlert />
                <ParticipationCard />
            </div>
        </FluidLayout>
    );
};

export default RegistrationElection;
