import React from "react";
import dayjs from "dayjs";

import { useCurrentElection } from "_app";
import { Container, Heading, Text } from "_app/ui";
import { extractElectionDates } from "elections";

export const ElectionScheduleSegment = () => {
    const {
        data: currentElection,
        isLoading: isLoadingElection,
        isError: isErrorElection,
    } = useCurrentElection();

    if (isLoadingElection || isErrorElection || !currentElection) return null; // fail silently

    let electionDates = null;
    try {
        electionDates = extractElectionDates(currentElection);
    } catch (e) {
        return null;
    }

    // don't show anything if the next election is more than 2 weeks out
    if (dayjs().isBefore(electionDates.startDateTime.subtract(2, "weeks"))) {
        return null;
    }

    return (
        <Container className="space-y-2.5">
            <Heading size={3}>Election schedule</Heading>
            <Text>This is the projected timeline for election day.</Text>
            <Text>
                Although participants are not required to stay beyond the rounds
                they're participating in, we do expect the Community Room to
                turn into an epic watch party that you might not want to miss!
            </Text>
            <Text type="info">
                All times are UTC ({electionDates.startDateTime})
            </Text>
            <Schedule>
                <ScheduleEntry timeUtc="12:00">
                    Community Zoom Room opens. We'll discuss what to expect, how
                    to be prepared, and answer questions. (30 min)
                </ScheduleEntry>
                <ScheduleEntry timeUtc="12:30">
                    Opening ceremony in the Community Room (30 min)
                </ScheduleEntry>
                <ScheduleEntry timeUtc="13:00">
                    Election officially begins with Round 1 (1 hr)
                </ScheduleEntry>
                <ScheduleEntry timeUtc="14:00">
                    Round 2 begins (1 hr)
                </ScheduleEntry>
                <ScheduleEntry timeUtc="15:00">
                    Chief Delegates are elected
                </ScheduleEntry>
                <ScheduleEntry timeUtc="16:00">
                    Chief Delegates deliberate in the Community Room (time is
                    approximate)
                </ScheduleEntry>
                <ScheduleEntry timeUtc="17:00">
                    Head Chief is selected through sortition. Election ends.
                    Delegate funds are made available.
                </ScheduleEntry>
            </Schedule>
        </Container>
    );
};

export default ElectionScheduleSegment;

interface ScheduleEntry {
    timeUtc: string;
    children: React.ReactNode;
}

const ScheduleEntry = ({ timeUtc, children }: ScheduleEntry) => {
    const timeString = dayjs(`2021-10-09T${timeUtc}:00.000Z`).format("LT");
    return (
        <li>
            <div className="flex flex-col sm:flex-row sm:space-x-1">
                <div
                    className="font-medium sm:text-right"
                    style={{ width: 80 }}
                >
                    {timeString}
                    <span className="hidden sm:inline">:</span>
                </div>
                <div className="flex-1">{children}</div>
            </div>
        </li>
    );
};

interface ScheduleProps {
    children: React.ReactNode;
}

const Schedule = ({ children }: ScheduleProps) => (
    <ul className="space-y-4 sm:space-y-2.5 leading-5 tracking-tight text-gray-700">
        {children}
    </ul>
);
