import { Router } from "express";
import { Document } from "../models/Document.js";
import { DocumentVersion } from "../models/DocumentVersion.js";
import { MAX_VERSIONS_PER_DOC } from "../config.js";
import { requireAuth } from "../middleware/auth.js";
import { checkObjectId, validate } from "../middleware/validate.js";
import { createDocumentSchema, updateDocumentSchema } from "../schemas.js";
import { maybeSnapshot } from "../services/versions.js";

const router = Router();
router.param("id", checkObjectId);
router.param("versionId", checkObjectId);
router.use("/documents", requireAuth);
const out = (d) => ({ ...d, id: d._id.toString(), _id: d._id.toString() });

// A parent page must belong to the same user.
async function parentIsValid(parentId, userId) {
  return parentId == null || !!(await Document.exists({ _id: parentId, userId }));
}

// Moving a page under one of its own sub-pages would create a loop, so walk up from the new parent.
async function canMoveUnder(docId, parentId, userId) {
  if (parentId == null) return true;
  if (!(await parentIsValid(parentId, userId))) return false;
  for (let id = parentId, steps = 0; id && steps < 100; steps++) {
    if (String(id) === String(docId)) return false;
    id = (await Document.findOne({ _id: id, userId }).select("parentId").lean())?.parentId;
  }
  return true;
}

router.get("/documents", async (req, res) => {
  const docs = await Document.find({ userId: req.userId, isArchived: false }).sort({ updatedAt: -1, _id: -1 }).lean();
  res.json(docs.map(out));
});

router.post("/documents", validate(createDocumentSchema), async (req, res) => {
  const b = req.body;
  if (!(await parentIsValid(b.parentId, req.userId))) return res.status(400).json({ error: "Parent page not found." });
  const doc = await Document.create({
    title: b.title || "Untitled Document",
    content: b.content || "<p>Start writing your thoughts or press <b>/</b> for commands…</p>",
    icon: b.icon || "📝",
    cover: b.cover ?? null,
    status: b.status || "In Progress",
    priority: b.priority || "Medium",
    tags: b.tags || ["General"],
    isStarred: Boolean(b.isStarred),
    parentId: b.parentId ?? null,
    userId: req.userId,
  });
  res.status(201).json(out(doc.toObject()));
});

router.get("/documents/:id", async (req, res) => {
  const doc = await Document.findOne({ _id: req.params.id, userId: req.userId }).lean();
  if (!doc) return res.status(404).json({ error: "Document not found." });
  res.json(out(doc));
});

// Optimistic concurrency: the client sends the `version` it last saw as `baseVersion`.
// If the stored version is newer, answer 409 with the current page instead of
// silently overwriting another tab's work.
router.patch("/documents/:id", validate(updateDocumentSchema), async (req, res) => {
  const { baseVersion, ...updates } = req.body;
  if ("parentId" in updates && !(await canMoveUnder(req.params.id, updates.parentId, req.userId))) {
    return res.status(400).json({ error: "A page cannot be moved under itself or a missing page." });
  }
  const filter = { _id: req.params.id, userId: req.userId };
  if (typeof baseVersion === "number") filter.version = baseVersion;
  const touchesText = updates.content !== undefined || updates.title !== undefined;

  const updated = await Document.findOneAndUpdate(
    filter,
    { $set: updates, ...(touchesText ? { $inc: { version: 1 } } : {}) },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    const current = await Document.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!current) return res.status(404).json({ error: "Document not found." });
    return res.status(409).json({ error: "This page changed somewhere else.", current: out(current) });
  }
  if (touchesText) await maybeSnapshot(updated);
  res.json(out(updated));
});

router.get("/documents/:id/versions", async (req, res) => {
  if (!(await Document.exists({ _id: req.params.id, userId: req.userId }))) return res.status(404).json({ error: "Document not found." });
  const versions = await DocumentVersion.find({ documentId: req.params.id }).sort({ createdAt: -1 }).limit(MAX_VERSIONS_PER_DOC).lean();
  res.json(versions.map((v) => ({ id: v._id.toString(), title: v.title, content: v.content, version: v.version, createdAt: v.createdAt })));
});

router.post("/documents/:id/versions/:versionId/restore", async (req, res) => {
  const snap = await DocumentVersion.findOne({ _id: req.params.versionId, documentId: req.params.id, userId: req.userId }).lean();
  if (!snap) return res.status(404).json({ error: "Version not found." });
  const current = await Document.findOne({ _id: req.params.id, userId: req.userId }).lean();
  if (!current) return res.status(404).json({ error: "Document not found." });
  // Keep what we are about to overwrite, so a restore can itself be undone.
  await DocumentVersion.create({ documentId: current._id, userId: current.userId, title: current.title, content: current.content, version: current.version });
  const restored = await Document.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: { title: snap.title, content: snap.content }, $inc: { version: 1 } },
    { new: true }
  ).lean();
  res.json(out(restored));
});

// Deleting a page also deletes its sub-pages (all levels) and their history, so no page is left
// pointing at a parent that no longer exists (it would be invisible in the sidebar).
router.delete("/documents/:id", async (req, res) => {
  const root = await Document.findOne({ _id: req.params.id, userId: req.userId }).select("_id").lean();
  if (!root) return res.status(404).json({ error: "Document not found." });
  const seen = new Set([String(root._id)]);
  for (let level = [root._id]; level.length; ) {
    const kids = await Document.find({ userId: req.userId, parentId: { $in: [...level, ...level.map(String)] } }).select("_id").lean();
    level = kids.map((k) => k._id).filter((id) => !seen.has(String(id))); // `seen` also stops a parent loop
    level.forEach((id) => seen.add(String(id)));
  }
  const ids = [...seen];
  await Document.deleteMany({ _id: { $in: ids }, userId: req.userId });
  await DocumentVersion.deleteMany({ documentId: { $in: ids } });
  res.json({ message: "Document deleted successfully.", deleted: ids.length });
});

export default router;
