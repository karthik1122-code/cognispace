import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Task } from "../models/Task.js";
import { DocumentVersion } from "../models/DocumentVersion.js";
import { APP_URL, COOKIE_OPTIONS, CLEAR_COOKIE_OPTIONS, RESET_TOKEN_TTL_MS } from "../config.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, deleteAccountSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas.js";
import { checkLockout, clearFailures, recordFailure } from "../middleware/loginLockout.js";
import { sendEmail } from "../services/email.js";
import { seedUserStarterData } from "../services/seed.js";

const router = Router();
const publicUser = (u) => ({ id: u._id.toString(), name: u.name, email: u.email });

router.post("/auth/register", authLimiter, validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) return res.status(409).json({ error: "An account with that email already exists." });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  await seedUserStarterData(user._id.toString(), user.name);
  const token = signToken(user);
  res.cookie("token", token, COOKIE_OPTIONS).status(201).json({ user: publicUser(user) });
});

router.post("/auth/login", authLimiter, validate(loginSchema), checkLockout, async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  // Same message for an unknown email and a wrong password: don't reveal which emails exist.
  const ok = user ? await bcrypt.compare(password, user.password) : false;
  if (!ok) { await recordFailure(req); return res.status(401).json({ error: "Incorrect email or password." }); }
  await clearFailures(req);
  const token = signToken(user);
  res.cookie("token", token, COOKIE_OPTIONS).json({ user: publicUser(user) });
});

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const FORGOT_REPLY = { message: "If an account uses that email, a reset link is on its way. It works for 30 minutes." };

// Always answers the same way, so this cannot be used to find out which emails have accounts.
router.post("/auth/forgot", authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    user.resetTokenHash = sha256(token);
    user.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();
    const link = `${APP_URL}/?reset=${token}`;
    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your CogniSpace password",
        text: `Hi ${user.name},\n\nUse this link to choose a new password. It works for 30 minutes and only once:\n${link}\n\nIf you did not ask for this, ignore this email; your password stays the same.`,
      });
    } catch (err) {
      console.error("Password reset email failed:", err.message);
    }
  }
  res.json(FORGOT_REPLY);
});

// A valid token sets the new password, signs out every other device and signs this browser in.
router.post("/auth/reset", authLimiter, validate(resetPasswordSchema), async (req, res) => {
  const user = await User.findOne({ resetTokenHash: sha256(req.body.token), resetTokenExpires: { $gt: new Date() } });
  if (!user) return res.status(400).json({ error: "This reset link is invalid or has expired. Ask for a new one." });
  user.password = await bcrypt.hash(req.body.password, 12);
  user.resetTokenHash = null;
  user.resetTokenExpires = null;
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  await user.save();
  res.cookie("token", signToken(user), COOKIE_OPTIONS).json({ user: publicUser(user) });
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("token", CLEAR_COOKIE_OPTIONS).json({ message: "Logged out." });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  // A valid token for an account that no longer exists is treated as signed out.
  if (!user) return res.status(401).json({ error: "Invalid or expired session." });
  res.json({ user: publicUser(user) });
});

// Permanently deletes the account and all of its data. Needs the current password,
// so a stolen session cannot wipe an account.
router.delete("/auth/me", requireAuth, authLimiter, validate(deleteAccountSchema), async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found." });
  if (!(await bcrypt.compare(req.body.password, user.password))) return res.status(401).json({ error: "Incorrect password." });
  await Promise.all([
    DocumentVersion.deleteMany({ userId: req.userId }),
    Document.deleteMany({ userId: req.userId }),
    Task.deleteMany({ userId: req.userId }),
    User.deleteOne({ _id: user._id }),
  ]);
  res.clearCookie("token", CLEAR_COOKIE_OPTIONS).json({ message: "Account deleted." });
});

// Everything the user owns, as one JSON file (data portability).
router.get("/export", requireAuth, async (req, res) => {
  const [user, documents, tasks] = await Promise.all([
    User.findById(req.userId).select("-password").lean(),
    Document.find({ userId: req.userId }).lean(),
    Task.find({ userId: req.userId }).lean(),
  ]);
  if (!user) return res.status(404).json({ error: "User not found." });
  res.setHeader("Content-Disposition", 'attachment; filename="cognispace-export.json"');
  res.json({ exportedAt: new Date().toISOString(), user: { name: user.name, email: user.email }, documents, tasks });
});

export default router;
