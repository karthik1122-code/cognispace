import express, { type Router } from 'express';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../controllers/documentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Enforce auth verification on every route
router.use(authMiddleware as express.RequestHandler);

router.route('/')
  .get(getDocuments as express.RequestHandler)
  .post(createDocument as express.RequestHandler);

router.route('/:id')
  .get(getDocumentById as express.RequestHandler)
  .patch(updateDocument as express.RequestHandler)
  .delete(deleteDocument as express.RequestHandler);

export default router;
