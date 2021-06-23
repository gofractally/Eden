import { Request, Response } from "express";
import { serverConfig } from "../config";

export const infoHandler = (_req: Request, res: Response) => {
    res.json({
        appName: serverConfig.appName,
        version: serverConfig.appVersion,
    });
};
