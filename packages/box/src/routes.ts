import { Router } from "express";

import {
    infoHandler,
    ipfsUploadConfigHandler,
    ipfsUploadHandler,
} from "./handlers";

const router: Router = Router();

router.get("/", infoHandler);
router.post("/v1/ipfs-upload", ipfsUploadConfigHandler, ipfsUploadHandler);

export default router;
