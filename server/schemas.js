import mongoose from "mongoose";
import { z } from "zod";

// Request shapes, checked before anything reaches the database. Unknown fields are dropped.
const STATUS = ["In Progress", "Done", "In Review", "Backlog"];
const PRIORITY = ["Urgent", "High", "Medium", "Low"];
const objectId = z.string().refine((v) => mongoose.isValidObjectId(v), "Invalid id.");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80, "Name is too long."),
  email: z.string().trim().toLowerCase().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."),
  password: z.string().min(8, "Password must be 8-128 characters.").max(128, "Password must be 8-128 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email and password are required.").max(254),
  password: z.string().min(1, "Email and password are required.").max(128),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm.").max(128),
});

const docFields = {
  title: z.string().trim().max(200, "Title is too long."),
  content: z.string().max(900_000, "This page is too large to save."),
  icon: z.string().max(16),
  cover: z.string().max(500).nullable(),
  status: z.enum(STATUS),
  priority: z.enum(PRIORITY),
  tags: z.array(z.string().trim().max(40)).max(20),
  isStarred: z.boolean(),
  parentId: objectId.nullable(),
};

export const createDocumentSchema = z.object(docFields).partial();
export const updateDocumentSchema = z
  .object({ ...docFields, isArchived: z.boolean(), baseVersion: z.number().int().nonnegative() })
  .partial();

const taskFields = {
  name: z.string().trim().min(1).max(200),
  status: z.enum(STATUS),
  priority: z.enum(PRIORITY),
  assignee: z.string().trim().max(60),
  dueDate: z.string().trim().max(40),
  progress: z.number().min(0).max(100),
};

export const createTaskSchema = z.object({ ...taskFields, documentId: objectId.nullable() }).partial();
export const updateTaskSchema = z.object(taskFields).partial();
