import { Request, Response } from "express";
import { serverConfig } from "../config";

export const infoHandler = async (
    _req: Request,
    res: Response
): Promise<void> => {
    res.send({
        appName: serverConfig.appName,
        version: serverConfig.appVersion,
    });
};
