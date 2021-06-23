import express from "express";
import cors from "cors";
import { json as bpJson, urlencoded as bpUrlencoded } from "body-parser";

import routes from "./routes";
import { serverConfig } from "./config";

// rest of the code remains same
const app = express();
app.locals.name = serverConfig.appName;
app.locals.version = serverConfig.appVersion;

app.use(cors());

app.use(bpJson());
app.use(bpUrlencoded({ extended: true }));

app.use("/", routes);

app.listen(serverConfig.port, () => {
    console.info(
        `Server running at http://${serverConfig.host}:${serverConfig.port}`
    );
});
