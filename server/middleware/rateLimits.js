import rateLimit from "express-rate-limit";
import { AI_DAILY_LIMIT } from "../config.js";

const limit = (windowMs, max, error, extra = {}) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error }, ...extra });

// AI limits are keyed by user (applied after requireAuth), because AI calls cost real money.
const perUser = { keyGenerator: (req) => req.userId || req.ip, validate: { keyGeneratorIpFallback: false } };

export const apiLimiter = limit(60 * 1000, 300, "Too many requests. Slow down a little.");
export const authLimiter = limit(15 * 60 * 1000, Number(process.env.AUTH_RATE_LIMIT || 20), "Too many attempts. Try again in a few minutes.");
export const aiBurstLimiter = limit(60 * 1000, 10, "You're sending AI requests too fast.", perUser);
export const aiDailyLimiter = limit(24 * 60 * 60 * 1000, AI_DAILY_LIMIT, "Daily AI limit reached. It resets in 24 hours.", perUser);
