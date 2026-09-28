import type { Response } from 'express';
import { Document } from '../models/Document';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';

// Helper to extract user ID across both req.userId and req.user.id
const getUserId = (req: AuthenticatedRequest) => {
  return (req as any).userId || req.user?.id || '65f8a0000000000000000001';
};

// GET /api/documents - Fetch sidebar list
export const getDocuments = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const documents = await Document.find({
      userId,
      isArchived: false,
    })
      .select('title parentId updatedAt createdAt content')
      .sort({ updatedAt: -1 });

    res.status(200).json(documents);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve documents.', message: error.message });
  }
};

// GET /api/documents/:id - Fetch full document with HTML content
export const getDocumentById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const document = await Document.findOne({
      _id: req.params.id,
      userId,
    });

    if (!document) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    res.status(200).json(document);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load document.', message: error.message });
  }
};

// POST /api/documents - Create a new blank page
export const createDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { title, parentId, content } = req.body;

    const newDocument = await Document.create({
      title: title || 'Untitled Page',
      content: content || '<p></p>',
      userId,
      parentId: parentId || null,
    });

    res.status(201).json(newDocument);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to initialize document.', message: error.message });
  }
};

// PATCH /api/documents/:id - Target of the 800ms debounce loop
export const updateDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { title, content } = req.body;
    const updateFields: Record<string, any> = {};

    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;

    const updatedDocument = await Document.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedDocument) {
      res.status(404).json({ error: 'Document not found or access denied.' });
      return;
    }

    res.status(200).json(updatedDocument);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save document modifications.', message: error.message });
  }
};

// DELETE /api/documents/:id - Soft-delete / archive
export const deleteDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const archivedDocument = await Document.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { isArchived: true } },
      { new: true }
    );

    if (!archivedDocument) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    res.status(200).json({ message: 'Document moved to trash.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete document.', message: error.message });
  }
};

export default {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
};
