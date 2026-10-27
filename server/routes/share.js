import { Router } from "express";
import { Document } from "../models/Document.js";

const router = Router();

// Public, read-only view of a shared page. Only display fields are returned: no owner, no ids, no history.
router.get("/share/:shareId", async (req, res) => {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(req.params.shareId)) return res.status(404).json({ error: "This link does not work any more." });
  const doc = await Document.findOne({ shareId: req.params.shareId, isArchived: false }).select("title icon cover content updatedAt").lean();
  if (!doc) return res.status(404).json({ error: "This link does not work any more." });
  res.setHeader("Cache-Control", "no-store");
  res.json({ title: doc.title, icon: doc.icon, cover: doc.cover, content: doc.content, updatedAt: doc.updatedAt });
});

export default router;
