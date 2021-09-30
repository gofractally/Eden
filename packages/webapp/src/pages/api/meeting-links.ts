import type { NextApiRequest, NextApiResponse } from "next";
import {
    UnauthorizedRequestError,
    BadRequestError,
    handleErrors,
} from "@edenos/common";
import { v4 as uuidv4 } from "uuid";
import { parseCookies } from "nookies";

import {
    MeetingLinkRequest,
    meetingLinkRequestSchema,
    AvailableMeetingClients,
} from "_api/schemas";
import {
    zoomRefreshAuth,
    zoomAccountJWTIsExpired,
    setZoomJWTCookie,
} from "_api/zoom-commons";

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
    const parsedCookies = parseCookies({ req });

    const result = meetingLinkRequestSchema.safeParse(JSON.parse(req.body));
    if (!result.success) {
        return handleErrors(res, new BadRequestError(result.error.flatten()));
    }

    try {
        const meeting = await generateMeeting(parsedCookies, result.data, res);
        return res.status(200).json({ meeting });
    } catch (error) {
        console.error(error);
        return handleErrors(res, error);
    }
};

export const generateMeeting = async (
    cookies: any,
    meetingRequest: MeetingLinkRequest,
    res: NextApiResponse
) => {
    switch (meetingRequest.client as AvailableMeetingClients) {
        case AvailableMeetingClients.Zoom:
            return generateZoomMeeting(cookies, meetingRequest, res);
        default:
            throw new BadRequestError("meeting client not supported");
    }
};

/**
 * Zoom Meeting Create API can be found here:
 * https://marketplace.zoom.us/docs/api-reference/zoom-api/meetings/meetingcreate
 */
const generateZoomMeeting = async (
    cookies: any,
    meetingRequest: MeetingLinkRequest,
    res: NextApiResponse
) => {
    if (!cookies.zoomAccountJWT) {
        throw new UnauthorizedRequestError(["missing zoom account JWT"]);
    }

    let zoomAccountJWT = JSON.parse(
        Buffer.from(cookies.zoomAccountJWT, "base64").toString()
    );
    if (zoomAccountJWTIsExpired(zoomAccountJWT)) {
        zoomAccountJWT = await zoomRefreshAuth(zoomAccountJWT.refresh_token);
        setZoomJWTCookie(zoomAccountJWT, res);
    }

    const body = {
        topic: meetingRequest.topic,
        duration: meetingRequest.duration,
        start_time: meetingRequest.startTime,
        password: uuidv4().substr(0, 8),
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
            Authorization: `Bearer ${zoomAccountJWT.access_token}`,
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
