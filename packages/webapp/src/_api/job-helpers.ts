import { NextApiRequest, NextApiResponse } from "next";
import { BadRequestError, handleErrors } from "./error-handlers";

export const jobHandler = async (
    req: NextApiRequest,
    res: NextApiResponse,
    jobKey: string,
    executeJob: () => Promise<any>
) => {
    try {
        authJobRequest(req, jobKey);
        const jobResponse = await executeJob();
        return res.status(200).json(jobResponse);
    } catch (error) {
        console.error(error);
        return handleErrors(res, error);
    }
};

export const authJobRequest = (req: NextApiRequest, jobKey: string) => {
    if (req.method !== "POST") {
        throw new BadRequestError(["request not supported"]);
    }

    const xJobKey = req.headers["x-job-key"];
    if (!xJobKey || jobKey !== xJobKey) {
        throw new Error("Invalid Job Key");
    }
};
