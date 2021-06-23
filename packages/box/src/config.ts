import * as packageJson from "../package.json";

export const serverConfig = {
    appName: process.env.APP_NAME || packageJson.name,
    appVersion: packageJson.version,
    host: process.env.SERVER_HOST || "localhost",
    port: process.env.SERVER_PORT || "3032",
};
