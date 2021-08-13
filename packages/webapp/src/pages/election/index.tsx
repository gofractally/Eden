import { FluidLayout, useCurrentElection } from "_app";
import { Container, Heading, Loader } from "_app/ui";
import { OngoingElection, RegistrationElection } from "elections";
import { ElectionStatus } from "elections/interfaces";
import { EncryptionPasswordAlert } from "encryption";

export const ElectionPage = () => {
    const { data: currentElection, isLoading } = useCurrentElection();

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
            {isLoading ? (
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
            return <RegistrationElection />;
        case ElectionStatus.Active:
        case ElectionStatus.Final: // TODO: This is one state where there's a board but no satoshi. UI should reflect that.
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
