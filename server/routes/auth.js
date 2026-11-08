import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import { checkLockout } from "../middleware/loginLockout.js";
import { registerSchema, loginSchema, deleteAccountSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas.js";
import * as c from "../controllers/auth.controller.js";

// URL -> middleware (rate limit, validation, login) -> controller.
const router = Router();
router.post("/auth/register", authLimiter, validate(registerSchema), c.register);
router.post("/auth/login", authLimiter, validate(loginSchema), checkLockout, c.login);
router.post("/auth/demo", authLimiter, c.demo);
router.post("/auth/forgot", authLimiter, validate(forgotPasswordSchema), c.forgot);
router.post("/auth/reset", authLimiter, validate(resetPasswordSchema), c.reset);
router.post("/auth/logout", c.logout);
router.get("/auth/me", requireAuth, c.me);
router.delete("/auth/me", requireAuth, authLimiter, validate(deleteAccountSchema), c.deleteAccount);
router.get("/export", requireAuth, c.exportData);

export default router;
