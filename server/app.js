import express from "express";
import cookieParser from "cookie-parser";
import fs from "fs";
import path from "path";
import { DIST_PATH } from "./config.js";
import { isDatabaseReady } from "./db.js";
import { requireAuth } from "./middleware/auth.js";
import { corsPolicy, securityHeaders } from "./middleware/security.js";
import { apiLimiter, aiBurstLimiter, aiDailyLimiter } from "./middleware/rateLimits.js";
import { errorHandler } from "./middleware/errors.js";
import authRoutes from "./routes/auth.js";
import documentRoutes from "./routes/documents.js";
import taskRoutes from "./routes/tasks.js";
import { streamAiTransform } from "./controllers/aiController.js";

/** Builds the Express app without connecting to a database or listening, so tests can use it directly. */
export function createApp({ serveFrontend = true } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1); // Render sits behind one proxy; needed for real client IPs in rate limiting

  app.use(securityHeaders);
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(corsPolicy);
  app.use("/api/", apiLimiter);

  const api = express.Router();
  api.use(authRoutes);
  api.use(documentRoutes);
  api.use(taskRoutes);
  api.post("/ai/transform", requireAuth, aiBurstLimiter, aiDailyLimiter, streamAiTransform);
  app.use("/api", api);
  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

  // Public health check: 200 only when the database is connected, so the host can restart a broken instance.
  app.get("/health", (_req, res) => {
    const ready = isDatabaseReady();
    res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "starting", app: "CogniSpace" });
  });

  // The all-in-one deploy also serves the built React app.
  if (serveFrontend && fs.existsSync(DIST_PATH)) {
    app.use(express.static(DIST_PATH));
    app.use((req, res, next) => (req.method === "GET" ? res.sendFile(path.join(DIST_PATH, "index.html")) : next()));
  }

  app.use(errorHandler);
  return app;
}
