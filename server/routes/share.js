import { Router } from "express";
import { viewShared } from "../controllers/document.controller.js";

// Public, read-only view of a shared page. Mounted before the signed-in routes.
const router = Router();
router.get("/share/:shareId", viewShared);

export default router;
