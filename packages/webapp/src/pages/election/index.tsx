import { FluidLayout, useCurrentElection } from "_app";
import { Container, Heading } from "_app/ui";
import { OngoingElection, RegistrationElection } from "elections";
import { EncryptionPasswordAlert } from "encryption";

export const ElectionPage = () => {
    const { data: currentElection } = useCurrentElection();

    // TODO: Enum for election states?
    return (
        <FluidLayout
            title="Election"
            banner={<EncryptionPasswordAlert promptSetupEncryptionKey />}
        >
            <div className="divide-y">
                <Container>
                    <Heading size={1}>Election</Heading>
                </Container>
                {currentElection?.electionState ===
                "current_election_state_registration" ? (
                    <RegistrationElection />
                ) : (
                    <OngoingElection />
                )}
            </div>
        </FluidLayout>
    );
};

export default ElectionPage;
