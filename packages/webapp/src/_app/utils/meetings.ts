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
        "Invalid Meeting link. Please paste a generated Zoom Meeting link with the enclosed Password"
    );
};
