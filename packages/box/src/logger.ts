import winston from "winston";
import morgan from "morgan";
import { Express, Response as ExpressResponse } from "express";

import { env } from "./config";

const enumerateErrorFormat = winston.format((info) => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

const logger = winston.createLogger({
    level: env === "development" ? "debug" : "info",
    format: winston.format.combine(
        enumerateErrorFormat(),
        env === "development"
            ? winston.format.colorize()
            : winston.format.uncolorize(),
        winston.format.splat(),
        winston.format.printf(({ level, message }) => `${level}: ${message}`)
    ),
    transports: [
        new winston.transports.Console({
            stderrLevels: ["error"],
        }),
    ],
});

export default logger;

morgan.token(
    "message",
    (req, res: ExpressResponse) => res.locals.errorMessage || ""
);
const getIpFormat = () => (env === "production" ? ":remote-addr - " : "");

const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`;
export const successHandler = morgan(successResponseFormat, {
    skip: (_req, res) => res.statusCode >= 400,
    stream: { write: (message) => logger.info(message.trim()) },
});

const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;
export const errorHandler = morgan(errorResponseFormat, {
    skip: (_req, res) => res.statusCode < 400,
    stream: { write: (message) => logger.error(message.trim()) },
});

export const setupExpressLogger = (app: Express) => {
    // app.use(morgan(env === "development" ? "dev" : "tiny"));
    app.use(successHandler);
    app.use(errorHandler);
};
