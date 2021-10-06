import React from "react";
import { CurrentElection } from "elections/interfaces";

import {
    ElectionScheduleSegment,
    ElectionVideoUploadCTA,
    ParticipationCard,
    ViewPreviousElectionResultsCTA,
} from "./registration-election-components";

interface Props {
    election?: CurrentElection;
}

export const RegistrationElection = ({ election }: Props) => {
    return (
        <>
            <ParticipationCard election={election} />
            <ElectionScheduleSegment />
            <ElectionVideoUploadCTA />
            <ViewPreviousElectionResultsCTA />
        </>
    );
};

export default RegistrationElection;
