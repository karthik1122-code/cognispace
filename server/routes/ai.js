import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { aiBurstLimiter, aiDailyLimiter } from "../middleware/rateLimits.js";
import { streamAiTransform } from "../controllers/ai.controller.js";

// Copilot: signed in, short-burst and daily limits (to control cost), then a streamed Gemini reply.
const router = Router();
router.post("/ai/transform", requireAuth, aiBurstLimiter, aiDailyLimiter, streamAiTransform);

export default router;
