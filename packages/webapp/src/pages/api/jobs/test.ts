import type { NextApiRequest, NextApiResponse } from "next";

import { jobKeys } from "config";
import { jobHandler } from "_api/job-helpers";

const TEST_JOB_KEY = jobKeys.gc;

export default async (req: NextApiRequest, res: NextApiResponse) =>
    jobHandler(req, res, TEST_JOB_KEY, testJob);

const testJob = async () => {
    console.info("Job Authorized!");
    console.info("Test Completed!");
    return { success: "Test Job Completed!" };
};
