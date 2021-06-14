// http://localhost:3000/api/redirect/zoom?code=n5fFXS8S68_9fmhzhg5T9CBi8dPqn6LMQ

import { zoom } from "config";
import type { NextApiRequest, NextApiResponse } from "next";
import * as z from "zod";

import { BadRequestError, handleErrors } from "_api/error-handlers";
// import { ipfsPostSchema } from "_api/schemas";
// import { ipfsUploadHandler } from "_api/handlers";

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

    return res.status(200).json({ data, zoomResponseData });
};
