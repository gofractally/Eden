import { NextApiResponse } from "next";

export const handleErrors = (
    res: NextApiResponse,
    errors: string[],
    statusCode = 400
) => res.status(statusCode).json({ errors });
