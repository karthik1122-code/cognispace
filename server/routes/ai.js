import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { aiBurstLimiter, aiDailyLimiter } from "../middleware/rateLimits.js";
import { checkObjectId, validate } from "../middleware/validate.js";
import { askSchema, createPageTasksSchema, suggestTasksSchema } from "../schemas.js";
import { streamAiTransform, streamAskWorkspace, suggestPageTasks, createPageTasks, getAiStatus } from "../controllers/ai.controller.js";

// Copilot: signed in, short-burst and daily limits (to control cost), then a streamed Gemini reply.
const router = Router();
router.get("/ai/status", getAiStatus);
router.param("id", checkObjectId);
router.post("/ai/transform", requireAuth, aiBurstLimiter, aiDailyLimiter, streamAiTransform);
// Ask across every page the user owns, with numbered sources.
router.post("/ai/ask", requireAuth, validate(askSchema), aiBurstLimiter, aiDailyLimiter, streamAskWorkspace);
// Notes -> tasks: suggest action items from a page, then create the picked ones linked to it.
router.post("/documents/:id/suggest-tasks", requireAuth, validate(suggestTasksSchema), aiBurstLimiter, aiDailyLimiter, suggestPageTasks);
router.post("/documents/:id/tasks", requireAuth, validate(createPageTasksSchema), createPageTasks);

export default router;
