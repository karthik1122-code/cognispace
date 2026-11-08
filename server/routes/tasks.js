import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { checkObjectId, validate } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../schemas.js";
import * as c from "../controllers/task.controller.js";

// Sprint-board tasks. Every route needs a signed-in user.
const router = Router();
router.param("id", checkObjectId);
router.use("/tasks", requireAuth);

router.get("/tasks", c.list);
router.post("/tasks", validate(createTaskSchema), c.create);
router.patch("/tasks/:id", validate(updateTaskSchema), c.update);
router.delete("/tasks/:id", c.remove);

export default router;
