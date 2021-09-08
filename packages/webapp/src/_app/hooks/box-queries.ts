import { useQuery } from "@edenos/common/dist/subchain";

export interface ElectionStatusQuery {
    status: {
        nextElection: string; // iso datetime string WITH timezone
        electionThreshold: number;
        numElectionParticipants: number;
    };
}

export const useElectionStatus = () =>
    useQuery<ElectionStatusQuery>(`
{
    status {
        nextElection
        electionThreshold
        numElectionParticipants
    }
}
`);
