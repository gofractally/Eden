import dayjs from "dayjs";

export const extractElectionDates = (election: any) => {
    const startDateTimeString = `${
        (election?.election_seeder && election.election_seeder.end_time) ||
        election?.start_time
    }Z`;

    if (!startDateTimeString) {
        throw new Error("Error parsing the Election start date.");
    }

    console.info(startDateTimeString);
    const startDateTime = dayjs(startDateTimeString);
    const participationTimeLimit = startDateTime.subtract(24, "hour");
    const estimatedEndDateTime = startDateTime.add(
        10, // TODO: estimate and calculate this value properly based on round numbers
        "hour"
    );

    return { startDateTime, participationTimeLimit, estimatedEndDateTime };
};
