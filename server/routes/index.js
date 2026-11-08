import { Router } from "express";
import shareRoutes from "./share.js";
import authRoutes from "./auth.js";
import documentRoutes from "./documents.js";
import taskRoutes from "./tasks.js";
import aiRoutes from "./ai.js";

// Every API route, mounted under /api by app.js. Public share links come first.
const api = Router();
api.use(shareRoutes);
api.use(authRoutes);
api.use(documentRoutes);
api.use(taskRoutes);
api.use(aiRoutes);

export default api;
