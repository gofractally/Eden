import type { NextApiRequest, NextApiResponse } from "next";

import { BadRequestError, handleErrors } from "_api/error-handlers";
import { ipfsPostSchema } from "_api/schemas";
import { ipfsUploadHandler } from "_api/handlers";

export default async (req: NextApiRequest, res: NextApiResponse) => {
    switch (req.method) {
        case "POST":
            return handlePostIpfs(req, res);
        default:
            return handleErrors(
                res,
                new BadRequestError(["request not supported"])
            );
    }
};

const handlePostIpfs = async (req: NextApiRequest, res: NextApiResponse) => {
    const result = ipfsPostSchema.safeParse(req.body);
    if (!result.success) {
        return handleErrors(
            res,
            new BadRequestError(result.error.flatten().formErrors)
        );
    }

    try {
        return res.status(200).json(await ipfsUploadHandler(result.data));
    } catch (error) {
        return handleErrors(res, error);
    }
};
