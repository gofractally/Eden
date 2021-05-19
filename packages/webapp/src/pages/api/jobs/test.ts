import type { NextApiRequest, NextApiResponse } from "next";

import {
    BadRequestError,
    UnauthorizedRequestError,
    handleErrors,
} from "_api/error-handlers";
import { jobKeys } from "config";
import { authJobRequest } from "_api/job-helpers";

const TEST_JOB_KEY = jobKeys.gc;

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") {
        return handleErrors(
            res,
            new BadRequestError(["request not supported"])
        );
    }

    try {
        authJobRequest(req, TEST_JOB_KEY);
    } catch (error) {
        console.error(error);
        return handleErrors(
            res,
            new UnauthorizedRequestError(["Unauthorized request"])
        );
    }

    console.info("Job Authorized!");
    console.info("Test Completed!");

    return res.status(200).json({ success: "Test Job Completed!" });
};
