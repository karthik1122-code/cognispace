import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { checkObjectId, validate } from "../middleware/validate.js";
import { createDocumentSchema, updateDocumentSchema } from "../schemas.js";
import * as c from "../controllers/document.controller.js";

// Pages. Every route needs a signed-in user; :id and :versionId must be valid ids (else 404).
const router = Router();
router.param("id", checkObjectId);
router.param("versionId", checkObjectId);
router.use("/documents", requireAuth);

router.get("/documents", c.list);
router.post("/documents", validate(createDocumentSchema), c.create);
router.get("/documents/:id", c.get);
router.patch("/documents/:id", validate(updateDocumentSchema), c.update);
router.delete("/documents/:id", c.remove);
router.get("/documents/:id/versions", c.versions);
router.post("/documents/:id/versions/:versionId/restore", c.restore);
router.post("/documents/:id/share", c.share);
router.delete("/documents/:id/share", c.unshare);

export default router;
