const acceptedMeetingRegexes = [
    // Zoom Meeting Link with Password
    // eg: https://us05web.zoom.us/j/12340622987?pwd=Z3EvYWpaNk5mWURXMlZWbUU4Lzd56789
    /^https?:\/\/[\S.]*\zoom\.us\/j\/[\S]+\?pwd=[\S]+$/,
];

export const validateMeetingLink = (meetingLink: string) => {
    console.info("validating meeting link", meetingLink);
    if (!meetingLink) {
        throw new Error("Meeting link is empty");
    }

    for (const regex of acceptedMeetingRegexes) {
        if (regex.test(meetingLink)) {
            return;
        }
    }

    throw new Error(
        "Invalid meeting link. Please enter a generated Zoom meeting link with the password appended to the end. E.g., https://us06web.zoom.us/j/71043116043?pwd=RZFqdZ1TUFBzSVRE."
    );
};
