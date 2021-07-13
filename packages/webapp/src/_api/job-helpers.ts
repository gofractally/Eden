import { NextApiRequest, NextApiResponse } from "next";
import { BadRequestError, handleErrors } from "@edenos/common";

export const jobHandler = async (
    req: NextApiRequest,
    res: NextApiResponse,
    jobKey: string,
    executeJob: (params?: any) => Promise<any>,
    requestParser?: any
) => {
    try {
        authJobRequest(req, jobKey);
        const parsedJobRequest = parseJobRequest(requestParser, req.body);
        const jobResponse = await executeJob(parsedJobRequest);
        return res.status(200).json(jobResponse);
    } catch (error) {
        console.error(error);
        return handleErrors(res, error);
    }
};

const authJobRequest = (req: NextApiRequest, jobKey: string) => {
    if (req.method !== "POST") {
        throw new BadRequestError(["request not supported"]);
    }

    const xJobKey = req.headers["x-job-key"];
    if (!xJobKey || jobKey !== xJobKey) {
        throw new Error("Invalid Job Key");
    }
};

const parseJobRequest = (requestParser: any, body: any) => {
    if (!requestParser) return undefined;
    const result = requestParser(body);
    if (!result.success) {
        throw new BadRequestError(result.error.flatten());
    }
    return result.data;
};
