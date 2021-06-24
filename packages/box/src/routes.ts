import { Router } from "express";

import {
    infoHandler,
    trxUploadConfigHandler,
    trxUploadHandler,
} from "./handlers";

const router: Router = Router();

router.get("/", infoHandler);
router.post("/v1/trx-upload", trxUploadConfigHandler, trxUploadHandler);

export default router;
