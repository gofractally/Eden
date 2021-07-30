import express from "express";
import cors from "cors";
import { json as bpJson, urlencoded as bpUrlencoded } from "body-parser";

import routes from "./routes";
import { serverConfig, env } from "./config";
import logger, { setupExpressLogger } from "./logger";

// rest of the code remains same
const app = express();
app.locals.name = serverConfig.appName;
app.locals.version = serverConfig.appVersion;

setupExpressLogger(app);
app.use(cors());
app.use(bpJson());
app.use(bpUrlencoded({ extended: true }));

app.use("/", routes);

app.listen(serverConfig.port, () => {
    logger.info(
        `Server running at: http://${serverConfig.host}:${serverConfig.port}`
    );
    logger.info(`Environment=${env}`);
});
