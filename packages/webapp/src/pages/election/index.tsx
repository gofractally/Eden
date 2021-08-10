import { FluidLayout, useCurrentElection } from "_app";
import { Container, Heading } from "_app/ui";
import { OngoingElection, RegistrationElection } from "elections";
import { ElectionStatus } from "elections/interfaces";
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
                <ElectionBody electionState={currentElection?.electionState} />
            </div>
        </FluidLayout>
    );
};

const ElectionBody = ({ electionState }: { electionState?: string }) => {
    switch (electionState) {
        case ElectionStatus.Registration:
            return <RegistrationElection />;
        case ElectionStatus.Active:
        case ElectionStatus.Final: // TODO: This is one state where there's a board but no satoshi. UI should reflect that.
            return <OngoingElection />;
        default:
            return (
                <Container>
                    <Heading size={2}>Unhandled state</Heading>
                </Container>
            );
    }
};

export default ElectionPage;
