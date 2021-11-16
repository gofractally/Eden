import { Router } from "express";
import { subchainConfig } from "./config";

import {
    infoHandler,
    ipfsUploadConfigHandler,
    ipfsUploadHandler,
    subchainHandler,
    sessionHandler,
} from "./handlers";

const router: Router = Router();

router.get("/", infoHandler);
router.post("/v1/ipfs-upload", ipfsUploadConfigHandler, ipfsUploadHandler);
router.use("/v1/sessions", sessionHandler);
if (subchainConfig.enable) router.use("/v1/subchain", subchainHandler);

export default router;
