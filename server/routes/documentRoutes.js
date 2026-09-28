import express from "express";
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.route("/").get(getDocuments).post(createDocument);
router.route("/:id").get(getDocumentById).patch(updateDocument).delete(deleteDocument);

export default router;
