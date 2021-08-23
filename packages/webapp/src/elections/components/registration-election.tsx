import { CurrentElection } from "elections/interfaces";

import {
    ElectionFAQ,
    ParticipationCard,
} from "./registration-election-components";

interface Props {
    election?: CurrentElection;
}

export const RegistrationElection = ({ election }: Props) => {
    return (
        <>
            <ParticipationCard election={election} />
            <ElectionFAQ />
        </>
    );
};

export default RegistrationElection;
