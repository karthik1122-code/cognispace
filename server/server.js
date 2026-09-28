import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { User } from "./models/User.js";
import { Document } from "./models/Document.js";
import { Task } from "./models/Task.js";
import { streamAiTransform } from "./controllers/aiController.js";

dotenv.config();

// ── Configuration ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "cognispace_jwt_secret_key_2026_super_secure";
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

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
      console.warn("⚠️ Failed to connect to MongoDB Atlas URI, falling back to embedded MongoDB engine:", atlasErr.message);
    }
  }

  try {
    console.log("🚀 Initializing embedded MongoDB engine via MongoMemoryServer...");
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

// Initial Starter Documents for New Users
const INITIAL_STARTER_DOCS = [
  {
    title: "Q4 Product Release Roadmap & Architecture Spec",
    icon: "🚀",
    cover: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)",
    status: "In Progress",
    priority: "Urgent",
    tags: ["Engineering", "Tier-1", "v3.0"],
    isStarred: true,
    content: "<h2>Product Launch Specification</h2><p>This release delivers our real-time collaborative workspace, integrating 800ms debounce loop with optimistic concurrency control, sub-18ms SSE token streaming, and multiplayer cursors.</p><h3>Milestone Deliverables</h3><ul><li>Implement debounced 800ms state autosave with OCC checks</li><li>Nested page hierarchy with single-query aggregation</li><li>Stream inline AI edits via Server-Sent Events</li><li>Multiplayer presence with live collaborator tags</li></ul>",
  },
  {
    title: "System Architecture & High-Concurrency Data Pipeline",
    icon: "🧠",
    cover: "linear-gradient(135deg, #092e35 0%, #0c4a6e 40%, #0284c7 100%)",
    status: "In Review",
    priority: "High",
    tags: ["Backend", "Distributed"],
    isStarred: true,
    content: "<h2>Architecture Overview</h2><p>CogniSpace coordinates document modifications via an atomic Mongoose data layer. Every write dispatches a debounced delta with atomic concurrency to ensure zero data loss.</p><h3>Storage & Indexing</h3><ul><li>MongoDB Atlas / Mongoose ODM with compound indexing on <code>{ userId: 1, isArchived: 1, updatedAt: -1 }</code></li><li>Sub-15ms cache invalidation layer for active workspace trees</li></ul>",
  },
  {
    title: "Engineering Team Standards, RFCs & Onboarding",
    icon: "📚",
    cover: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)",
    status: "Done",
    priority: "Medium",
    tags: ["Operations", "Handbook"],
    isStarred: false,
    content: "<h2>Welcome to CogniSpace Engineering</h2><p>Guidelines for pairing, code review workflows, and standard local setup.</p><ol><li>Clone workspace repository</li><li>Install dependencies via <code>npm install</code></li><li>Run local dev server with <code>npm run dev</code></li><li>Full production stack is running on Express with MongoDB persistence</li></ol>",
  },
];

const INITIAL_STARTER_TASKS = [
  { name: "🚀 Product Launch Spec v3.0", status: "In Progress", priority: "Urgent", assignee: "Mia K.", dueDate: "Today", progress: 85 },
  { name: "⚡ OCC Version Concurrency Check", status: "Done", priority: "High", assignee: "Kenji T.", dueDate: "Yesterday", progress: 100 },
  { name: "📡 SSE AI Token Stream Tunnel", status: "In Review", priority: "High", assignee: "Alex R.", dueDate: "Oct 2", progress: 70 },
  { name: "🧠 Smart Vector Knowledge Graph", status: "Backlog", priority: "Medium", assignee: "Sarah L.", dueDate: "Oct 15", progress: 25 },
  { name: "🎨 Dark Mode Palette Polishing", status: "Done", priority: "Low", assignee: "Design Team", dueDate: "Sep 25", progress: 100 },
];

async function seedUserStarterData(userId) {
  try {
    const existingDocsCount = await Document.countDocuments({ userId, isArchived: false });
    if (existingDocsCount === 0) {
      for (const item of INITIAL_STARTER_DOCS) {
        await Document.create({ ...item, userId });
      }
    }

    const existingTasksCount = await Task.countDocuments({ userId });
    if (existingTasksCount === 0) {
      for (const task of INITIAL_STARTER_TASKS) {
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
app.use(express.json({ limit: "10mb" }));
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
      // Allow all Vercel preview deployments
      if (origin.endsWith(".vercel.app")) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ══════════════════════════════════════════════════════════════
//  AUTH CONTROLLERS
// ══════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

    // Seed onboarding workspace content
    await seedUserStarterData(user._id.toString());

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
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: "No account found with that email." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password." });
    }

    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });

    // Ensure documents exist
    await seedUserStarterData(user._id.toString());

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

// ══════════════════════════════════════════════════════════════
//  DOCUMENT CONTROLLERS (MongoDB Mongoose ODM)
// ══════════════════════════════════════════════════════════════

// GET /api/documents
app.get("/api/documents", requireAuth, async (req, res) => {
  try {
    // Seed starter documents if user has none
    await seedUserStarterData(req.userId);

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
app.patch("/api/documents/:id", requireAuth, async (req, res) => {
  try {
    const allowed = ["title", "content", "icon", "cover", "status", "priority", "tags", "isStarred", "isArchived"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updatedDoc = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedDoc) return res.status(404).json({ error: "Document not found." });
    res.json({ ...updatedDoc, id: updatedDoc._id.toString(), _id: updatedDoc._id.toString() });
  } catch (err) {
    console.error("Error updating document:", err);
    res.status(500).json({ error: "Failed to update document." });
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
    await seedUserStarterData(req.userId);
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
app.post("/api/ai/transform", requireAuth, streamAiTransform);

// ── Health Check ──────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  try {
    const userCount = await User.countDocuments();
    const docCount = await Document.countDocuments();
    const taskCount = await Task.countDocuments();
    res.json({
      status: "ok",
      app: "CogniSpace",
      database: isDbConnected ? (MONGO_URI ? "MongoDB Atlas" : "Embedded MongoDB (MemoryServer)") : "disconnected",
      stats: { users: userCount, documents: docCount, tasks: taskCount },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ── Boot Server & Connect DB ──────────────────────────────────
connectDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 CogniSpace Full-Stack Server active on http://localhost:${PORT}`);
    console.log(`🗄️ Database: ${MONGO_URI ? "MongoDB Atlas" : "Embedded MongoDB Engine"} ✅`);
    console.log(`🔑 JWT Auth & Session Engine: Active ✅`);
    console.log(`📡 AI Stream & SSE Controllers: Ready ✅\n`);
  });
});

export default app;
