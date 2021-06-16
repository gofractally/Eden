import { zoom } from "config";
import type { NextApiRequest, NextApiResponse } from "next";
import * as z from "zod";

import { BadRequestError, handleErrors } from "_api/error-handlers";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case "GET":
            return handleGetZoomOAuth(req, res);
        default:
            return handleErrors(
                res,
                new BadRequestError(["request not supported"])
            );
    }
};

const ZOOM_OAUTH_REDIRECT = "http://localhost:3000/api/redirect/zoom";
const ZOOM_AUTHORIZATION = Buffer.from(
    zoom.clientKey + ":" + zoom.clientSecret
).toString("base64");

export const reqSchema = z.object({
    code: z.string().optional(),
});
export type ZoomOAuthRequest = z.infer<typeof reqSchema>;

const handleGetZoomOAuth = async (
    req: NextApiRequest,
    res: NextApiResponse
) => {
    const result = reqSchema.safeParse(req.query);
    if (!result.success) {
        return handleErrors(res, new BadRequestError(result.error.flatten()));
    }

    const data: ZoomOAuthRequest = result.data;

    const zoomResponse = await fetch(
        `https://zoom.us/oauth/token?grant_type=authorization_code&code=${data.code}&redirect_uri=${ZOOM_OAUTH_REDIRECT}`,
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${ZOOM_AUTHORIZATION}`,
            },
        }
    );
    const zoomResponseData = await zoomResponse.json();

    const testMeeting = await testCreateMeeting(zoomResponseData.access_token);

    return res.status(200).json({ data, zoomResponseData, testMeeting });
};

const testCreateMeeting = async (accessToken: string) => {
    const body = {
        topic: "Sparky Test Eden Election #5",
        duration: 10,
        start_time: "2025-06-15T13:35:00Z",
        settings: {
            join_before_host: true,
            jbh_time: 0,
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

    return response.json();
};
