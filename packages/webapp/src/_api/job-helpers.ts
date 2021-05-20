import { NextApiRequest } from "next";

export const authJobRequest = (req: NextApiRequest, jobKey: string) => {
    const xJobKey = req.headers["x-job-key"];
    if (!xJobKey || jobKey !== xJobKey) {
        throw new Error("Invalid Job Key");
    }
};
