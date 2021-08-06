import dayjs from "dayjs";

export const extractElectionDates = (election: any) => {
    const rawStartDateTime = `${
        (election?.election_seeder && election.election_seeder.end_time) ||
        election?.start_time
    }Z`;

    if (!rawStartDateTime) {
        throw new Error("Error parsing the Election start date.");
    }

    const startDateTime = dayjs(rawStartDateTime);
    const participationTimeLimit = startDateTime.subtract(24, "hour");
    const estimatedEndDateTime = startDateTime.add(
        10, // TODO: estimate and calculate this value properly based on round numbers
        "hour"
    );

    return {
        startDateTime,
        participationTimeLimit,
        estimatedEndDateTime,
        rawStartDateTime,
    };
};
