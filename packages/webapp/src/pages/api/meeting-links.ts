import { zoom } from "config";
import type { NextApiRequest, NextApiResponse } from "next";
import * as z from "zod";
import { BadRequestError, handleErrors } from "@edenos/common";

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

export const reqSchema = z.object({
    meetingClient: z.string(),
    accessToken: z.string(),
});
export type MeetingLinkRequest = z.infer<typeof reqSchema>;

const handleNewMeeting = async (req: NextApiRequest, res: NextApiResponse) => {
    const result = reqSchema.safeParse(JSON.parse(req.body));
    if (!result.success) {
        return handleErrors(res, new BadRequestError(result.error.flatten()));
    }

    const data: MeetingLinkRequest = result.data;

    if (data.meetingClient !== "zoom") {
        return handleErrors(res, new BadRequestError("invalid meeting client"));
    }

    const meeting = await generateMeeting(data.accessToken);
    return res.status(200).json({ meeting });
};

const generateMeeting = async (accessToken: string) => {
    const body = {
        topic: `Test Eden Election #${Math.floor(Math.random() * 100_000_000)}`,
        duration: 40,
        start_time: `2025-08-15T${Math.floor(Math.random() * 23)}:${Math.floor(
            Math.random() * 59
        )}:00Z`,
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
