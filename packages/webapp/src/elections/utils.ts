export const getElectionStartDateTime = (election: any) =>
    (election?.election_seeder && election.election_seeder.end_time) ||
    election?.start_time;
