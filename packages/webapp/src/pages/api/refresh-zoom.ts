import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { BadRequestError, handleErrors } from "@edenos/common";

import { zoomRefreshAuth } from "_api/zoom-commons";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case "POST":
            return handleZoomRefresh(req, res);
        default:
            return handleErrors(
                res,
                new BadRequestError(["request not supported"])
            );
    }
};

export const reqSchema = z.object({
    refreshToken: z.string(),
});
export type RefreshZoomRequest = z.infer<typeof reqSchema>;

const handleZoomRefresh = async (req: NextApiRequest, res: NextApiResponse) => {
    const result = reqSchema.safeParse(JSON.parse(req.body));
    if (!result.success) {
        return handleErrors(res, new BadRequestError(result.error.flatten()));
    }

    const data: RefreshZoomRequest = result.data;

    try {
        const zoomResponse = await zoomRefreshAuth(data.refreshToken);
        console.info(zoomResponse);
        return res.status(200).json(zoomResponse);
    } catch (error) {
        console.error(error);
        return handleErrors(res, new BadRequestError(error));
    }
};
