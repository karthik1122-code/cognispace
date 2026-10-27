import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

export const signToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });

export function requireAuth(req, res, next) {
  const token = req.cookies?.token || req.headers?.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required." });
  try {
    req.userId = jwt.verify(token, JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session." });
  }
}
