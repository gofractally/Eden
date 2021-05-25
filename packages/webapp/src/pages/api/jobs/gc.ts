import type { NextApiRequest, NextApiResponse } from "next";

import { jobKeys } from "config";
import { jobHandler } from "_api/job-helpers";

const GC_JOB_KEY = jobKeys.gc;

export default async (req: NextApiRequest, res: NextApiResponse) =>
    jobHandler(req, res, GC_JOB_KEY, gcJob);

const gcJob = async () => {};
