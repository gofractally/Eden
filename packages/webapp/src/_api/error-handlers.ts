import { NextApiResponse } from "next";

export class ServerError extends Error {
    constructor(public status: number, public error: any) {
        super(`Server Error: ${status} ${JSON.stringify(error)}`);
        this.name = "ServerError";
    }
}
export class BadRequestError extends ServerError {
    constructor(error: any) {
        super(400, error);
        this.name = "BadRequestError";
    }
}

export class UnauthorizedRequestError extends ServerError {
    constructor(error: any) {
        super(401, error);
        this.name = "UnauthorizedRequestError";
    }
}

export class InternalServerError extends ServerError {
    constructor(error: any) {
        super(500, error);
        this.name = "InternalServerError";
    }
}

export const handleErrors = (res: NextApiResponse, error: Error) => {
    if (error instanceof ServerError) {
        return res
            .status(error.status)
            .json({ type: error.name, error: error.error });
    } else {
        return res
            .status(500)
            .json({ error: error.message || "Unknown error" });
    }
};
