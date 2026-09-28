import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.token || req.headers?.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_jwt_key_cognispace_2026");
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired session token." });
  }
};

export default requireAuth;
