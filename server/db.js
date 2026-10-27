import mongoose from "mongoose";
import { IS_PROD, MONGO_URI } from "./config.js";

let memoryServer = null;

/**
 * Connects to MONGODB_URI. In development only, falls back to an embedded MongoDB
 * (mongodb-memory-server is a dev dependency and is never loaded in production).
 */
export async function connectDatabase() {
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log("Connected to MongoDB.");
      return "atlas";
    } catch (err) {
      if (IS_PROD) throw new Error(`Could not connect to MongoDB: ${err.message}`);
      console.warn("MongoDB unreachable, using an embedded database (dev only):", err.message);
    }
  } else if (IS_PROD) {
    throw new Error("MONGODB_URI is required in production.");
  }
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  console.log("Connected to an embedded MongoDB (data resets on restart).");
  return "memory";
}

export async function disconnectDatabase() {
  await mongoose.connection.close();
  if (memoryServer) await memoryServer.stop();
}

export const isDatabaseReady = () => mongoose.connection.readyState === 1;
