import { Document } from "../models/Document.js";

export const getDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.userId, isArchived: false })
      .select("title parentId updatedAt createdAt")
      .sort({ updatedAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents." });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, userId: req.userId });
    if (!doc) return res.status(404).json({ error: "Document not found." });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to load document." });
  }
};

export const createDocument = async (req, res) => {
  try {
    const { title, parentId } = req.body;
    const doc = await Document.create({
      title: title || "Untitled Document",
      content: "<p></p>",
      userId: req.userId,
      parentId: parentId || null,
    });
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to create document." });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: updates },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Document not found." });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to save document." });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { isArchived: true } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Document not found." });
    res.json({ message: "Document moved to trash." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete document." });
  }
};

export default {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
};
