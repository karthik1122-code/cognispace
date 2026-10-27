import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Task } from "../models/Task.js";
import { DocumentVersion } from "../models/DocumentVersion.js";
import { COOKIE_OPTIONS, CLEAR_COOKIE_OPTIONS } from "../config.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import { registerSchema, loginSchema, deleteAccountSchema } from "../schemas.js";
import { seedUserStarterData } from "../services/seed.js";

const router = Router();
const publicUser = (u) => ({ id: u._id.toString(), name: u.name, email: u.email });

router.post("/auth/register", authLimiter, validate(registerSchema), async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) return res.status(409).json({ error: "An account with that email already exists." });
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  await seedUserStarterData(user._id.toString(), user.name);
  const token = signToken(user._id.toString());
  res.cookie("token", token, COOKIE_OPTIONS).status(201).json({ user: publicUser(user), token });
});

router.post("/auth/login", authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  // Same message for an unknown email and a wrong password: don't reveal which emails exist.
  const ok = user ? await bcrypt.compare(password, user.password) : false;
  if (!ok) return res.status(401).json({ error: "Incorrect email or password." });
  const token = signToken(user._id.toString());
  res.cookie("token", token, COOKIE_OPTIONS).json({ user: publicUser(user), token });
});

router.post("/auth/logout", (_req, res) => {
  res.clearCookie("token", CLEAR_COOKIE_OPTIONS).json({ message: "Logged out." });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) return res.status(404).json({ error: "User not found." });
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
