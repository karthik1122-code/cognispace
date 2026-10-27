import { Router } from "express";
import { Task } from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";
import { checkObjectId, validate } from "../middleware/validate.js";
import { createTaskSchema, updateTaskSchema } from "../schemas.js";

const router = Router();
router.param("id", checkObjectId);
router.use("/tasks", requireAuth);
const out = (t) => ({ ...t, id: t._id.toString() });

router.get("/tasks", async (req, res) => {
  const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
  res.json(tasks.map((t) => ({ ...out(t), _id: t._id.toString() })));
});

router.post("/tasks", validate(createTaskSchema), async (req, res) => {
  const b = req.body;
  const task = await Task.create({
    name: b.name || "New Task Item",
    status: b.status || "In Progress",
    priority: b.priority || "Medium",
    assignee: b.assignee || "You",
    dueDate: b.dueDate || "Tomorrow",
    progress: b.progress ?? 0,
    documentId: b.documentId ?? null,
    userId: req.userId,
  });
  res.status(201).json(out(task.toObject()));
});

router.patch("/tasks/:id", validate(updateTaskSchema), async (req, res) => {
  const updated = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, { $set: req.body }, { new: true, runValidators: true }).lean();
  if (!updated) return res.status(404).json({ error: "Task not found." });
  res.json(out(updated));
});

router.delete("/tasks/:id", async (req, res) => {
  const deleted = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!deleted) return res.status(404).json({ error: "Task not found." });
  res.json({ message: "Task deleted." });
});

export default router;
