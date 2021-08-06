import { OngoingElection, RegistrationElection } from "elections";
import { useCurrentElection } from "_app";

export const ElectionPage = () => {
    const { data: currentElection } = useCurrentElection();
    // TODO: Enum for election states?
    return currentElection?.electionState ===
        "current_election_state_registration" ? (
        <RegistrationElection />
    ) : (
        <OngoingElection />
    );
};

export default ElectionPage;
