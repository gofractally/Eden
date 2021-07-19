import type { NextApiRequest, NextApiResponse } from "next";
import { BadRequestError, handleErrors } from "@edenos/common";

import {
    MeetingLinkRequest,
    meetingLinkRequestSchema,
    AvailableMeetingClients,
} from "_api/schemas";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case "POST":
            return handleNewMeeting(req, res);
        default:
            return handleErrors(
                res,
                new BadRequestError(["request not supported"])
            );
    }
};

const handleNewMeeting = async (req: NextApiRequest, res: NextApiResponse) => {
    const result = meetingLinkRequestSchema.safeParse(JSON.parse(req.body));
    if (!result.success) {
        return handleErrors(res, new BadRequestError(result.error.flatten()));
    }

    try {
        const meeting = await generateMeeting(result.data);
        return res.status(200).json({ meeting });
    } catch (error) {
        console.error(error);
        return handleErrors(res, error);
    }
};

export const generateMeeting = async (meetingRequest: MeetingLinkRequest) => {
    console.info(meetingRequest);
    switch (meetingRequest.client as AvailableMeetingClients) {
        case AvailableMeetingClients.Zoom:
            return generateZoomMeeting(meetingRequest.accessToken);
        default:
            throw new BadRequestError("meeting client not supported");
    }
};

/**
 * Zoom Meeting Create API can be found here:
 * https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate
 */
const generateZoomMeeting = async (accessToken: string) => {
    const body = {
        topic: `Test Eden Election #${Math.floor(Math.random() * 100_000_000)}`,
        duration: 40,
        start_time: `2025-08-15T${Math.floor(Math.random() * 23)}:${Math.floor(
            Math.random() * 59
        )}:00Z`,
        settings: {
            join_before_host: true,
            jbh_time: 0,
            waiting_room: false,
            auto_recording: "local",
        },
    };

    const response = await fetch(`https://api.zoom.us/v2/users/me/meetings`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new BadRequestError(await response.json());
    } else {
        return response.json();
    }
};
