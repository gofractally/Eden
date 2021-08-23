import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { FluidLayout, useCurrentElection, usePrevious } from "_app";
import { ROUTES } from "_app/config";
import { Container, Heading, Loader } from "_app/ui";
import {
    ErrorLoadingElection,
    OngoingElection,
    RegistrationElection,
} from "elections";
import { ElectionStatus } from "elections/interfaces";
import { EncryptionPasswordAlert } from "encryption";

export const ElectionPage = () => {
    const router = useRouter();
    const [isElectionComplete, setIsElectionComplete] = useState(false);
    const { data: currentElection, isLoading, isError } = useCurrentElection();
    const prevElectionState = usePrevious(currentElection?.electionState);

    useEffect(() => {
        if (prevElectionState !== ElectionStatus.Final) return;
        if (currentElection?.electionState === ElectionStatus.Registration) {
            setIsElectionComplete(true);
            router.push(ROUTES.DELEGATION.href);
        }
    }, [currentElection]);

    if (isError) return <ErrorLoadingElection />;

    return (
        <FluidLayout
            title="Election"
            banner={
                <EncryptionPasswordAlert
                    promptSetupEncryptionKey={
                        currentElection?.electionState !==
                        ElectionStatus.Registration
                    }
                />
            }
        >
            {isLoading || isElectionComplete ? (
                <LoaderSection />
            ) : (
                <div className="divide-y">
                    <Container>
                        <Heading size={1}>Election</Heading>
                    </Container>
                    <ElectionBody election={currentElection} />
                </div>
            )}
        </FluidLayout>
    );
};

export default ElectionPage;

const ElectionBody = ({ election }: { election: any }) => {
    switch (election.electionState) {
        case ElectionStatus.Registration:
        case ElectionStatus.Seeding:
        case ElectionStatus.Voters:
            return <RegistrationElection election={election} />;
        case ElectionStatus.Active:
        case ElectionStatus.Final:
            return <OngoingElection election={election} />;
        default:
            return <LoaderSection />;
    }
};

const LoaderSection = () => (
    <Container>
        <Loader />
    </Container>
);
