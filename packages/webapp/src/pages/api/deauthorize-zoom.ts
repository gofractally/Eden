import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { BadRequestError, handleErrors } from "@edenos/common";

import { zoomRefreshAuth } from "_api/zoom-commons";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case "POST":
            return handleZoomDeauthorization(req, res);
        default:
            return handleErrors(
                res,
                new BadRequestError(["request not supported"])
            );
    }
};

// See: https://marketplace.zoom.us/docs/guides/auth/deauthorization#event-notifications
export const reqSchema = z.object({
    event: z.string(),
    payload: z.object({
        account_id: z.string(),
        user_id: z.string(),
        signature: z.string(),
        deauthorization_time: z.string(),
        client_id: z.string(),
    }),
});
export type DeauthorizeZoomRequest = z.infer<typeof reqSchema>;

/**
 * Zoom App Marketplace terms require that we expose a Zoom app deauthorization endpoint.
 * Because we store no data relating to the user's Zoom account, this is a no-op.
 */
const handleZoomDeauthorization = async (
    req: NextApiRequest,
    res: NextApiResponse
) => {
    const result = reqSchema.safeParse(req.body);
    if (!result.success) {
        return handleErrors(res, new BadRequestError(result.error.flatten()));
    }

    const data: DeauthorizeZoomRequest = result.data;
    return res.status(200).json({ result: "success" });
};
