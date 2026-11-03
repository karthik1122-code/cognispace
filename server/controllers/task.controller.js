import * as tasks from "../services/task.service.js";

// HTTP layer for sprint-board tasks.
const { toClient } = tasks;

export const list = async (req, res) => res.json((await tasks.listTasks(req.userId)).map((t) => ({ ...toClient(t), _id: t._id.toString() })));
export const create = async (req, res) => res.status(201).json(toClient(await tasks.createTask(req.userId, req.body)));
export const update = async (req, res) => res.json(toClient(await tasks.updateTask(req.userId, req.params.id, req.body)));
export async function remove(req, res) {
  await tasks.deleteTask(req.userId, req.params.id);
  res.json({ message: "Task deleted." });
}
