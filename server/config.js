import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config(); // repo-root .env
dotenv.config({ path: path.resolve(here, ".env") }); // server/.env (does not override)

export const IS_PROD = process.env.NODE_ENV === "production";
export const PORT = process.env.PORT || 3001;
export const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
export const DIST_PATH = path.resolve(here, "../dist");

// Never ship a guessable signing key: production must provide JWT_SECRET,
// development gets a random per-boot secret (sessions reset on restart).
let secret = process.env.JWT_SECRET;
if (!secret) {
  if (IS_PROD) {
    console.error("Fatal: JWT_SECRET is required in production.");
    process.exit(1);
  }
  secret = crypto.randomBytes(32).toString("hex");
  if (process.env.NODE_ENV !== "test") console.warn("JWT_SECRET not set: using a random dev secret (sessions reset on restart).");
}
export const JWT_SECRET = secret;

const sameSite = IS_PROD ? "none" : "lax";
export const COOKIE_OPTIONS = { httpOnly: true, secure: IS_PROD, sameSite, maxAge: 7 * 24 * 60 * 60 * 1000 };
export const CLEAR_COOKIE_OPTIONS = { httpOnly: true, secure: IS_PROD, sameSite };

export const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || 60);
export const VERSION_SNAPSHOT_MIN_GAP_MS = 2 * 60 * 1000; // at most one history snapshot per 2 min per doc
export const MAX_VERSIONS_PER_DOC = 50;
