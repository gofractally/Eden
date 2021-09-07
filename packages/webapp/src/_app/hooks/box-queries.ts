import { useQuery } from "@edenos/common/dist/subchain";

// todo: needs some review... ideally it should always return an object
// with a nullable data, not an undefined query
interface Query<T> {
    data?: T;
}
type SubchainQuery<T> = Query<T> | undefined;

const useSubchainQuery = <T>(query: string) =>
    useQuery<SubchainQuery<T>>(query);

export interface ElectionStatusQuery {
    nextElection: string; // datetime iso string WITH timezone
    electionThreshold: number;
    numElectionParticipants: number;
}

export const useElectionStatus = () =>
    useSubchainQuery<ElectionStatusQuery>(`
{
    status {
        nextElection
        electionThreshold
        numElectionParticipants
    }
}
`);
