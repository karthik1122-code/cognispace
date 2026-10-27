import { PORT, MONGO_URI } from "./config.js";
import { connectDatabase, disconnectDatabase } from "./db.js";
import { createApp } from "./app.js";

const app = createApp();

try {
  const kind = await connectDatabase();
  const server = app.listen(PORT, () => {
    console.log(`CogniSpace API on http://localhost:${PORT} (database: ${kind === "memory" ? "embedded" : "MongoDB"}${MONGO_URI ? "" : ", no MONGODB_URI set"})`);
  });

  // On shutdown, finish open requests, then close the database cleanly.
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down.`);
    server.close(() => disconnectDatabase().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
} catch (err) {
  console.error("Fatal:", err.message);
  process.exit(1);
}

export default app;
