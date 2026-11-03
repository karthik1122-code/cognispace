import crypto from "crypto";
import { Document } from "../models/Document.js";
import { DocumentVersion } from "../models/DocumentVersion.js";
import { MAX_VERSIONS_PER_DOC } from "../config.js";
import { maybeSnapshot } from "./versions.js";
import { badRequest, conflict, notFound } from "../lib/httpError.js";

// Pages for one user. Every query includes userId, so nobody can read or change another user's pages.
export const toClient = (d) => ({ ...d, id: d._id.toString(), _id: d._id.toString() });
const NOT_FOUND = "Document not found.";

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

export async function listDocuments(userId) {
  return Document.find({ userId, isArchived: false }).sort({ updatedAt: -1, _id: -1 }).lean();
}

export async function createDocument(userId, b) {
  if (!(await parentIsValid(b.parentId, userId))) throw badRequest("Parent page not found.");
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
    userId,
  });
  return doc.toObject();
}

export async function getDocument(userId, id) {
  const doc = await Document.findOne({ _id: id, userId }).lean();
  if (!doc) throw notFound(NOT_FOUND);
  return doc;
}

// Optimistic concurrency: the client sends the `version` it last saw as `baseVersion`.
// If the stored version is newer, throw 409 with the current page instead of silently overwriting another tab's work.
export async function updateDocument(userId, id, { baseVersion, ...updates }) {
  if ("parentId" in updates && !(await canMoveUnder(id, updates.parentId, userId))) {
    throw badRequest("A page cannot be moved under itself or a missing page.");
  }
  const filter = { _id: id, userId };
  if (typeof baseVersion === "number") filter.version = baseVersion;
  const touchesText = updates.content !== undefined || updates.title !== undefined;
  const updated = await Document.findOneAndUpdate(
    filter,
    { $set: updates, ...(touchesText ? { $inc: { version: 1 } } : {}) },
    { new: true, runValidators: true }
  ).lean();
  if (!updated) {
    const current = await Document.findOne({ _id: id, userId }).lean();
    if (!current) throw notFound(NOT_FOUND);
    throw conflict("This page changed somewhere else.", { current: toClient(current) });
  }
  if (touchesText) await maybeSnapshot(updated);
  return updated;
}

export async function listVersions(userId, id) {
  if (!(await Document.exists({ _id: id, userId }))) throw notFound(NOT_FOUND);
  const versions = await DocumentVersion.find({ documentId: id }).sort({ createdAt: -1 }).limit(MAX_VERSIONS_PER_DOC).lean();
  return versions.map((v) => ({ id: v._id.toString(), title: v.title, content: v.content, version: v.version, createdAt: v.createdAt }));
}

export async function restoreVersion(userId, id, versionId) {
  const snap = await DocumentVersion.findOne({ _id: versionId, documentId: id, userId }).lean();
  if (!snap) throw notFound("Version not found.");
  const current = await Document.findOne({ _id: id, userId }).lean();
  if (!current) throw notFound(NOT_FOUND);
  // Keep what we are about to overwrite, so a restore can itself be undone.
  await DocumentVersion.create({ documentId: current._id, userId: current.userId, title: current.title, content: current.content, version: current.version });
  return Document.findOneAndUpdate({ _id: id, userId }, { $set: { title: snap.title, content: snap.content }, $inc: { version: 1 } }, { new: true }).lean();
}

// Read-only sharing. The link holds a random id, so only people who get the link can open the page.
export async function enableSharing(userId, id) {
  const doc = await Document.findOne({ _id: id, userId });
  if (!doc) throw notFound(NOT_FOUND);
  if (!doc.shareId) { doc.shareId = crypto.randomBytes(18).toString("base64url"); await doc.save(); }
  return doc.shareId;
}

export async function disableSharing(userId, id) {
  const doc = await Document.findOneAndUpdate({ _id: id, userId }, { $set: { shareId: null } });
  if (!doc) throw notFound(NOT_FOUND);
}

// Public view of a shared page. Only display fields: no owner, no ids, no history.
export async function getShared(shareId) {
  const gone = notFound("This link does not work any more.");
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(shareId)) throw gone;
  const doc = await Document.findOne({ shareId, isArchived: false }).select("title icon cover content updatedAt").lean();
  if (!doc) throw gone;
  return { title: doc.title, icon: doc.icon, cover: doc.cover, content: doc.content, updatedAt: doc.updatedAt };
}

// Deleting a page also deletes its sub-pages (all levels) and their history, so no page is left
// pointing at a parent that no longer exists (it would be invisible in the sidebar).
export async function deleteDocumentTree(userId, id) {
  const root = await Document.findOne({ _id: id, userId }).select("_id").lean();
  if (!root) throw notFound(NOT_FOUND);
  const seen = new Set([String(root._id)]);
  for (let level = [root._id]; level.length; ) {
    const kids = await Document.find({ userId, parentId: { $in: [...level, ...level.map(String)] } }).select("_id").lean();
    level = kids.map((k) => k._id).filter((kid) => !seen.has(String(kid))); // `seen` also stops a parent loop
    level.forEach((kid) => seen.add(String(kid)));
  }
  const ids = [...seen];
  await Document.deleteMany({ _id: { $in: ids }, userId });
  await DocumentVersion.deleteMany({ documentId: { $in: ids } });
  return ids.length;
}
