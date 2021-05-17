import { NextApiResponse } from "next";

export class ServerError extends Error {
    constructor(public status: number, public errors: string[]) {
        super(`Server Error: ${status} ${errors[0]}`);
        this.name = "ServerError";
    }
}
export class BadRequestError extends ServerError {
    constructor(errors: string[]) {
        super(400, errors);
        this.name = "BadRequestError";
    }
}

export class InternalServerError extends ServerError {
    constructor(errors: string[]) {
        super(500, errors);
        this.name = "InternalServerError";
    }
}

export const handleErrors = (res: NextApiResponse, error: Error) => {
    if (error instanceof ServerError) {
        return res.status(error.status).json({ errors: error.errors });
    } else {
        return res
            .status(500)
            .json({ error: error.message || "Unknown error" });
    }
};
