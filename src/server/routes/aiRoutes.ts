import { Router } from 'express';
import { streamTransformHandler } from '../controllers/aiController';
import { authMiddleware } from '../middleware/authMiddleware';
import { aiRateLimiter } from '../middleware/rateLimitMiddleware';

const router = Router();

/**
 * POST /api/ai/transform
 * Protected with JWT authMiddleware and rate-limiting.
 * Streams transformed text via SSE (Server-Sent Events).
 */
router.post('/transform', authMiddleware, aiRateLimiter, streamTransformHandler);

export default router;
