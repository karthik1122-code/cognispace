import { LoginAttempt } from "../models/LoginAttempt.js";

const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;
const keyFor = (req) => `${String(req.body?.email || "").toLowerCase()}|${req.ip}`;

/** Too many wrong passwords for one email from one address locks that pair for 15 minutes. */
export async function checkLockout(req, res, next) {
  const row = await LoginAttempt.findOne({ key: keyFor(req) }).lean();
  if (row && row.count >= MAX_FAILURES && row.expiresAt > new Date()) {
    return res.status(429).json({ error: "Too many wrong passwords. Try again in 15 minutes, or reset your password." });
  }
  next();
}

export async function recordFailure(req) {
  await LoginAttempt.updateOne(
    { key: keyFor(req) },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + WINDOW_MS) } },
    { upsert: true }
  );
}

export const clearFailures = (req) => LoginAttempt.deleteOne({ key: keyFor(req) });
