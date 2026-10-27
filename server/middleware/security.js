import cors from "cors";
import { ALLOWED_ORIGINS, IS_PROD } from "../config.js";

export function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (IS_PROD) res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
}

// The app's own origin is always allowed (the all-in-one deploy serves page and API together).
// Other origins must be listed in CORS_ORIGINS; unlisted ones get no CORS headers, so the browser blocks them.
export const corsPolicy = cors((req, callback) => {
  const origin = req.headers.origin;
  let sameOrigin = false;
  try { sameOrigin = !!origin && new URL(origin).host === req.headers.host; } catch { /* malformed Origin header */ }
  const allowed = !origin || sameOrigin || ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*");
  callback(null, { origin: allowed, credentials: true });
});
