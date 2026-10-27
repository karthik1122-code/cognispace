import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { User } from "../models/User.js";

/** The token carries the account's session version; changing the password bumps it and signs out every device. */
export const signToken = (user) => jwt.sign({ id: user._id.toString(), v: user.sessionVersion || 0 }, JWT_SECRET, { expiresIn: "7d" });

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required." });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid or expired session." });
  }
  const user = await User.findById(payload.id).select("sessionVersion").lean();
  if (!user || (payload.v || 0) !== (user.sessionVersion || 0)) return res.status(401).json({ error: "Invalid or expired session." });
  req.userId = payload.id;
  next();
}
