import { Router } from "express";

import { infoHandler } from "./handlers";

const router: Router = Router();

router.get("/", infoHandler);

export default router;
