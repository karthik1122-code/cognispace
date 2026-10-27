import { DocumentVersion } from "../models/DocumentVersion.js";
import { MAX_VERSIONS_PER_DOC, VERSION_SNAPSHOT_MIN_GAP_MS } from "../config.js";

/** Saves a history snapshot at most once every two minutes per page, keeping the newest 50. */
export async function maybeSnapshot(doc) {
  try {
    const last = await DocumentVersion.findOne({ documentId: doc._id }).sort({ createdAt: -1 }).lean();
    if (last && Date.now() - new Date(last.createdAt).getTime() < VERSION_SNAPSHOT_MIN_GAP_MS) return;
    await DocumentVersion.create({ documentId: doc._id, userId: doc.userId, title: doc.title, content: doc.content, version: doc.version });
    const extra = await DocumentVersion.find({ documentId: doc._id }).sort({ createdAt: -1 }).skip(MAX_VERSIONS_PER_DOC).select("_id").lean();
    if (extra.length) await DocumentVersion.deleteMany({ _id: { $in: extra.map((v) => v._id) } });
  } catch (err) {
    console.warn("Snapshot failed (non-fatal):", err.message);
  }
}
