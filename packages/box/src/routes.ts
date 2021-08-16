import { Router } from "express";

import {
    infoHandler,
    ipfsUploadConfigHandler,
    ipfsUploadHandler,
    subchainHandler,
} from "./handlers";

const router: Router = Router();

router.get("/", infoHandler);
router.use("/v1/subchain", subchainHandler);
router.post("/v1/ipfs-upload", ipfsUploadConfigHandler, ipfsUploadHandler);

export default router;
