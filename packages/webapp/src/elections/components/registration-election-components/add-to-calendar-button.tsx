import React from "react";
import AddToCalendar from "@culturehq/add-to-calendar";
import { CalendarEvent } from "@culturehq/add-to-calendar/dist/makeUrls";

import { Button } from "_app/ui";
import { CurrentElection, extractElectionDates } from "elections";

interface Props {
    election: CurrentElection;
}

export const AddToCalendarButton = ({ election }: Props) => {
    let electionDates = null;
    try {
        electionDates = extractElectionDates(election);
    } catch (e) {
        return null;
    }

    const calendarEvent: CalendarEvent = {
        name: "Eden Election",
        details: "Join us at https://genesis.eden.eoscommunity.org/election",
        location: "Remote",
        startsAt: electionDates.startDateTime.toISOString(),
        endsAt: electionDates.estimatedEndDateTime.toISOString(),
    };

    return (
        <div className="-my-1">
            <AddToCalendar event={calendarEvent}>
                <Button
                    type="neutral"
                    onClick={() => {}}
                    className="-ml-2.5 -mt-1"
                >
                    Add to calendar
                </Button>
            </AddToCalendar>
        </div>
    );
};

export default AddToCalendarButton;
