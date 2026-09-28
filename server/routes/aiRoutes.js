import express from "express";
import { streamAiTransform } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.post("/transform", requireAuth, streamAiTransform);

export default router;
