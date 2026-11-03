import { Task } from "../models/Task.js";
import { notFound } from "../lib/httpError.js";

// Sprint-board tasks for one user. Every query includes userId.
export const toClient = (t) => ({ ...t, id: t._id.toString() });

export const listTasks = (userId) => Task.find({ userId }).sort({ createdAt: -1, _id: -1 }).lean();

export async function createTask(userId, b) {
  const task = await Task.create({
    name: b.name || "New Task Item",
    status: b.status || "In Progress",
    priority: b.priority || "Medium",
    assignee: b.assignee || "You",
    dueDate: b.dueDate || "Tomorrow",
    progress: b.progress ?? 0,
    documentId: b.documentId ?? null,
    userId,
  });
  return task.toObject();
}

export async function updateTask(userId, id, updates) {
  const updated = await Task.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true, runValidators: true }).lean();
  if (!updated) throw notFound("Task not found.");
  return updated;
}

export async function deleteTask(userId, id) {
  const deleted = await Task.findOneAndDelete({ _id: id, userId });
  if (!deleted) throw notFound("Task not found.");
}
