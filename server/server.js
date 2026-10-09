import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { User } from "./models/User.js";
import { Document } from "./models/Document.js";
import { Task } from "./models/Task.js";
import { DocumentVersion } from "./models/DocumentVersion.js";
import { streamAiTransform } from "./controllers/aiController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "../dist");

dotenv.config(); // repo-root .env
dotenv.config({ path: path.resolve(__dirname, ".env") }); // server/.env (does not override)

// ── Configuration ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Never ship a guessable signing key: production must provide JWT_SECRET,
// development gets a random per-boot secret (sessions reset on restart).
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (IS_PROD) {
    console.error("❌ Fatal: JWT_SECRET is required in production.");
    process.exit(1);
  }
  JWT_SECRET = crypto.randomBytes(32).toString("hex");
  console.warn("⚠️ JWT_SECRET not set — using a random dev secret (sessions reset on restart).");
}
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const VERSION_SNAPSHOT_MIN_GAP_MS = 2 * 60 * 1000; // at most one history snapshot / 2 min / doc
const MAX_VERSIONS_PER_DOC = 50;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

// ── MongoDB Connection with Atlas / Memory Resilience ──────────────────────
let mongoServerInstance = null;
let isDbConnected = false;

async function connectDatabase() {
  if (MONGO_URI) {
    try {
      console.log(`🔌 Attempting connection to MongoDB Atlas at ${MONGO_URI.replace(/:([^@]+)@/, ":****@")}...`);
      await mongoose.connect(MONGO_URI);
      isDbConnected = true;
      console.log("✅ Successfully connected to MongoDB Atlas!");
      return;
    } catch (atlasErr) {
      if (IS_PROD) {
        // A silent in-memory DB in production would lose every user's data on restart.
        console.error("❌ Fatal: could not connect to MongoDB in production:", atlasErr.message);
        process.exit(1);
      }
      console.warn("⚠️ Failed to connect to MongoDB, falling back to embedded MongoDB (dev only):", atlasErr.message);
    }
  } else if (IS_PROD) {
    console.error("❌ Fatal: MONGODB_URI is required in production.");
    process.exit(1);
  }

  try {
    console.log("🚀 Initializing embedded MongoDB engine via MongoMemoryServer...");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    mongoServerInstance = await MongoMemoryServer.create();
    const uri = mongoServerInstance.getUri();
    await mongoose.connect(uri);
    isDbConnected = true;
    console.log(`✅ Connected to embedded MongoDB engine at ${uri}`);
  } catch (memErr) {
    console.error("❌ Fatal: Failed to initialize MongoDB engine:", memErr);
    process.exit(1);
  }
}

async function seedUserStarterData(userId, userName) {
  try {
    let name = userName;
    if (!name) {
      const foundUser = await User.findById(userId).lean();
      name = foundUser?.name || "You";
    }
    const firstName = name.split(" ")[0] || "You";

    const existingDocsCount = await Document.countDocuments({ userId, isArchived: false });
    if (existingDocsCount === 0) {
      const starterDocs = [
        {
          title: `👋 Welcome to CogniSpace`,
          icon: "🚀",
          cover: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
          status: "In Progress",
          priority: "High",
          tags: ["Welcome", "Guide"],
          isStarred: true,
          content: `<h2>Welcome to your fresh workspace, ${firstName}!</h2><p>CogniSpace combines the versatility of a Notion-style block editor with Google Gemini AI and sprint tracking.</p><h3>⚡ Quick Start Checklist</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="false">Type <b>/</b> anywhere on an empty line to insert headings, toggles, or code</li><li data-type="taskItem" data-checked="false">Click <b>▶</b> on toggle lists to organize thoughts cleanly</li><li data-type="taskItem" data-checked="false">Highlight any text to rewrite or summarize with Gemini AI</li><li data-type="taskItem" data-checked="false">Click <b>+</b> in the sidebar to create new pages or sub-pages</li><li data-type="taskItem" data-checked="false">Switch to <b>Database</b> view in the sidebar to manage sprint tasks</li></ul><details open=""><summary><b>💡 Pro Tips &amp; Shortcuts</b></summary><p>• <b>⌘B</b> — Toggle sidebar<br/>• <b>⌘K</b> — Instant quick search<br/>• <b>⌘J</b> — Focus AI Copilot bar<br/>• <b>⌘N</b> — Create new document</p></details>`,
        },
        {
          title: "📝 Quick Notes & Scratchpad",
          icon: "💡",
          cover: "linear-gradient(135deg, #092e35 0%, #0c4a6e 40%, #0284c7 100%)",
          status: "In Progress",
          priority: "Medium",
          tags: ["Scratchpad", "Personal"],
          isStarred: false,
          content: "<h2>Personal Scratchpad</h2><p>Jot down quick thoughts, meeting notes, code snippets, or daily plans here. Your work autosaves automatically in real time.</p>",
        },
      ];

      for (const item of starterDocs) {
        await Document.create({ ...item, userId });
      }
    }

    const existingTasksCount = await Task.countDocuments({ userId });
    if (existingTasksCount === 0) {
      const starterTasks = [
        { name: "🚀 Explore CogniSpace editor", status: "In Progress", priority: "High", assignee: firstName, dueDate: "Today", progress: 60 },
        { name: "⚡ Try inserting a Toggle block with /", status: "In Progress", priority: "Medium", assignee: firstName, dueDate: "Today", progress: 20 },
        { name: "🤖 Highlight text to test Gemini AI Copilot", status: "Backlog", priority: "Medium", assignee: firstName, dueDate: "Tomorrow", progress: 0 },
        { name: "📊 Track sprints in Database view", status: "Backlog", priority: "Low", assignee: firstName, dueDate: "This week", progress: 0 },
      ];

      for (const task of starterTasks) {
        await Task.create({ ...task, userId });
      }
    }
  } catch (err) {
    console.error("Error seeding starter data for user:", err);
  }
}

// ── Auth Middleware ────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  const token =
    req.cookies?.token ||
    req.headers?.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
  }
};

// ── Express App Setup ──────────────────────────────────────────────────────
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1); // Render sits behind a proxy; needed for correct client IPs in rate limiting
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (IS_PROD) res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Build allowed origins list from env (supports multiple comma-separated URLs)
const rawOrigins = process.env.CORS_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ── Rate limiting ──────────────────────────────────────────────────────────
const jsonLimit = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });
app.use("/api/", jsonLimit(60 * 1000, 300, "Too many requests. Slow down a little."));
const authLimiter = jsonLimit(15 * 60 * 1000, 20, "Too many attempts. Try again in a few minutes.");
// AI calls cost real money: cap per user per day (keyed by userId, applied after auth)
const aiDailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: Number(process.env.AI_DAILY_LIMIT || 60),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  validate: { keyGeneratorIpFallback: false },
  message: { error: "Daily AI limit reached. It resets in 24 hours." },
});
const aiBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.userId || req.ip,
  validate: { keyGeneratorIpFallback: false },
  message: { error: "You're sending AI requests too fast." },
});

// ══════════════════════════════════════════════════════════════
//  AUTH CONTROLLERS
// ══════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid input." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: "Password must be 8-128 characters." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

    // Seed onboarding workspace content
    await seedUserStarterData(user._id.toString(), user.name);

    res
      .cookie("token", token, cookieOptions)
      .status(201)
      .json({
        user: { id: user._id.toString(), name: user.name, email: user.email },
        token,
      });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    // Same message for unknown email and wrong password: don't reveal which emails exist.
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;
    if (!user || !isMatch) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

    res
      .cookie("token", token, cookieOptions)
      .json({
        user: { id: user._id.toString(), name: user.name, email: user.email },
        token,
      });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// POST /api/auth/logout
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("token", clearCookieOptions).json({ message: "Logged out." });
});

// GET /api/auth/me
app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: { id: user._id.toString(), name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: "Server error fetching user session." });
  }
});

// DELETE /api/auth/me — permanently deletes the account and all of its data.
// Requires the current password so a stolen session cannot wipe an account.
app.delete("/api/auth/me", requireAuth, authLimiter, async (req, res) => {
  try {
    const { password } = req.body || {};
    if (typeof password !== "string" || !password) return res.status(400).json({ error: "Enter your password to confirm." });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Incorrect password." });

    await Promise.all([
      DocumentVersion.deleteMany({ userId: req.userId }),
      Document.deleteMany({ userId: req.userId }),
      Task.deleteMany({ userId: req.userId }),
      User.deleteOne({ _id: user._id }),
    ]);
    res.clearCookie("token", clearCookieOptions).json({ message: "Account deleted." });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Could not delete the account. Please try again." });
  }
});

// GET /api/export — everything the user owns, as one JSON file (data portability).
app.get("/api/export", requireAuth, async (req, res) => {
  try {
    const [user, documents, tasks] = await Promise.all([
      User.findById(req.userId).select("-password").lean(),
      Document.find({ userId: req.userId }).lean(),
      Task.find({ userId: req.userId }).lean(),
    ]);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.setHeader("Content-Disposition", 'attachment; filename="cognispace-export.json"');
    res.json({ exportedAt: new Date().toISOString(), user: { name: user.name, email: user.email }, documents, tasks });
  } catch (err) {
    res.status(500).json({ error: "Export failed." });
  }
});

// ══════════════════════════════════════════════════════════════
//  DOCUMENT CONTROLLERS (MongoDB Mongoose ODM)
// ══════════════════════════════════════════════════════════════

// GET /api/documents
app.get("/api/documents", requireAuth, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.userId, isArchived: false })
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = docs.map((d) => ({
      ...d,
      id: d._id.toString(),
      _id: d._id.toString(),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: "Failed to fetch documents." });
  }
});

// POST /api/documents
app.post("/api/documents", requireAuth, async (req, res) => {
  try {
    const newDoc = await Document.create({
      title: req.body.title || "Untitled Document",
      content: req.body.content || "<p>Start writing your thoughts or press <b>/</b> for commands…</p>",
      icon: req.body.icon || "📝",
      cover: req.body.cover || null,
      status: req.body.status || "In Progress",
      priority: req.body.priority || "Medium",
      tags: req.body.tags || ["General"],
      isStarred: Boolean(req.body.isStarred),
      userId: req.userId,
    });

    const formatted = {
      ...newDoc.toObject(),
      id: newDoc._id.toString(),
      _id: newDoc._id.toString(),
    };
    res.status(201).json(formatted);
  } catch (err) {
    console.error("Error creating document:", err);
    res.status(500).json({ error: "Failed to create document." });
  }
});

// GET /api/documents/:id
app.get("/api/documents/:id", requireAuth, async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).lean();

    if (!doc) return res.status(404).json({ error: "Document not found." });
    res.json({ ...doc, id: doc._id.toString(), _id: doc._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve document." });
  }
});

// PATCH /api/documents/:id
// Optimistic concurrency: the client sends the `version` it last saw as `baseVersion`.
// If the stored version is newer, we answer 409 with the current document instead of
// silently overwriting another tab's work.
app.patch("/api/documents/:id", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Document not found." });
    const allowed = ["title", "content", "icon", "cover", "status", "priority", "tags", "isStarred", "isArchived"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { baseVersion } = req.body;
    const filter = { _id: req.params.id, userId: req.userId };
    if (typeof baseVersion === "number") filter.version = baseVersion;

    const touchesText = updates.content !== undefined || updates.title !== undefined;
    const updatedDoc = await Document.findOneAndUpdate(
      filter,
      { $set: updates, ...(touchesText ? { $inc: { version: 1 } } : {}) },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedDoc) {
      const current = await Document.findOne({ _id: req.params.id, userId: req.userId }).lean();
      if (!current) return res.status(404).json({ error: "Document not found." });
      return res.status(409).json({
        error: "This page changed somewhere else.",
        current: { ...current, id: current._id.toString(), _id: current._id.toString() },
      });
    }

    if (touchesText) await maybeSnapshot(updatedDoc);
    res.json({ ...updatedDoc, id: updatedDoc._id.toString(), _id: updatedDoc._id.toString() });
  } catch (err) {
    console.error("Error updating document:", err);
    res.status(500).json({ error: "Failed to update document." });
  }
});

async function maybeSnapshot(doc) {
  try {
    const last = await DocumentVersion.findOne({ documentId: doc._id }).sort({ createdAt: -1 }).lean();
    if (last && Date.now() - new Date(last.createdAt).getTime() < VERSION_SNAPSHOT_MIN_GAP_MS) return;
    await DocumentVersion.create({
      documentId: doc._id,
      userId: doc.userId,
      title: doc.title,
      content: doc.content,
      version: doc.version,
    });
    const extra = await DocumentVersion.find({ documentId: doc._id }).sort({ createdAt: -1 }).skip(MAX_VERSIONS_PER_DOC).select("_id").lean();
    if (extra.length) await DocumentVersion.deleteMany({ _id: { $in: extra.map((v) => v._id) } });
  } catch (err) {
    console.warn("Snapshot failed (non-fatal):", err.message);
  }
}

// GET /api/documents/:id/versions
app.get("/api/documents/:id/versions", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: "Document not found." });
    const owns = await Document.exists({ _id: req.params.id, userId: req.userId });
    if (!owns) return res.status(404).json({ error: "Document not found." });
    const versions = await DocumentVersion.find({ documentId: req.params.id }).sort({ createdAt: -1 }).limit(MAX_VERSIONS_PER_DOC).lean();
    res.json(versions.map((v) => ({ id: v._id.toString(), title: v.title, content: v.content, version: v.version, createdAt: v.createdAt })));
  } catch (err) {
    res.status(500).json({ error: "Failed to load version history." });
  }
});

// POST /api/documents/:id/versions/:versionId/restore
app.post("/api/documents/:id/versions/:versionId/restore", requireAuth, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(req.params.versionId)) {
      return res.status(404).json({ error: "Version not found." });
    }
    const snap = await DocumentVersion.findOne({ _id: req.params.versionId, documentId: req.params.id, userId: req.userId }).lean();
    if (!snap) return res.status(404).json({ error: "Version not found." });
    const current = await Document.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!current) return res.status(404).json({ error: "Document not found." });
    // Keep what we're about to overwrite so a restore is itself undoable.
    await DocumentVersion.create({ documentId: current._id, userId: current.userId, title: current.title, content: current.content, version: current.version });
    const restored = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { title: snap.title, content: snap.content }, $inc: { version: 1 } },
      { new: true }
    ).lean();
    res.json({ ...restored, id: restored._id.toString(), _id: restored._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to restore version." });
  }
});

// DELETE /api/documents/:id
app.delete("/api/documents/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await Document.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!deleted) return res.status(404).json({ error: "Document not found." });
    await DocumentVersion.deleteMany({ documentId: deleted._id });
    res.json({ message: "Document deleted successfully." });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ error: "Failed to delete document." });
  }
});

// ══════════════════════════════════════════════════════════════
//  TASK / SPRINT CONTROLLERS (MongoDB Mongoose ODM)
// ══════════════════════════════════════════════════════════════

// GET /api/tasks
app.get("/api/tasks", requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    const formatted = tasks.map((t) => ({
      ...t,
      id: t._id.toString(),
      _id: t._id.toString(),
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sprint tasks." });
  }
});

// POST /api/tasks
app.post("/api/tasks", requireAuth, async (req, res) => {
  try {
    const task = await Task.create({
      name: req.body.name || "New Task Item",
      status: req.body.status || "In Progress",
      priority: req.body.priority || "Medium",
      assignee: req.body.assignee || "You",
      dueDate: req.body.dueDate || "Tomorrow",
      progress: req.body.progress ?? 0,
      userId: req.userId,
      documentId: req.body.documentId || null,
    });
    res.status(201).json({ ...task.toObject(), id: task._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to create sprint task." });
  }
});

// PATCH /api/tasks/:id
app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const allowed = ["name", "status", "priority", "assignee", "dueDate", "progress"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true }
    ).lean();
    if (!updated) return res.status(404).json({ error: "Task not found." });
    res.json({ ...updated, id: updated._id.toString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task." });
  }
});

// DELETE /api/tasks/:id
app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const deleted = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!deleted) return res.status(404).json({ error: "Task not found." });
    res.json({ message: "Task deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task." });
  }
});

// ══════════════════════════════════════════════════════════════
//  AI ROUTE (SSE streaming via Gemini or low-latency engine)
// ══════════════════════════════════════════════════════════════
app.post("/api/ai/transform", requireAuth, aiBurstLimiter, aiDailyLimiter, streamAiTransform);

// ── Health Check (public: no user/document counts) ───────────
app.get("/health", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "starting", app: "CogniSpace" });
});

// ── Serve React Frontend if dist/ exists (Render all-in-one deploy) ───────
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/health")) {
      return res.sendFile(path.join(distPath, "index.html"));
    }
    next();
  });
}

// ── Boot Server & Connect DB ──────────────────────────────────
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 CogniSpace Full-Stack Server active on http://localhost:${PORT}`);
    console.log(`🗄️ Database: ${MONGO_URI ? "MongoDB Atlas" : "Embedded MongoDB Engine"} ✅`);
    console.log(`🔑 JWT Auth & Session Engine: Active ✅`);
    console.log(`📡 AI Stream & SSE Controllers: Ready ✅\n`);
  });
});

function shutdown(signal) {
  console.log(`${signal} received — closing database connection.`);
  mongoose.connection.close().finally(() => process.exit(0));
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
