import { COOKIE_OPTIONS, CLEAR_COOKIE_OPTIONS } from "../config.js";
import { signToken } from "../middleware/auth.js";
import { clearFailures, recordFailure } from "../middleware/loginLockout.js";
import * as auth from "../services/auth.service.js";

// HTTP layer for accounts: cookies and status codes here, rules in services/auth.service.js.
const signIn = (res, user, status = 200) => res.cookie("token", signToken(user), COOKIE_OPTIONS).status(status).json({ user: auth.publicUser(user) });

export async function register(req, res) {
  signIn(res, await auth.register(req.body), 201);
}

export async function login(req, res) {
  const user = await auth.checkCredentials(req.body);
  if (!user) { await recordFailure(req); return res.status(401).json({ error: "Incorrect email or password." }); }
  await clearFailures(req);
  signIn(res, user);
}

export async function forgot(req, res) {
  await auth.requestPasswordReset(req.body.email);
  res.json({ message: "If an account uses that email, a reset link is on its way. It works for 30 minutes." });
}

export async function reset(req, res) {
  signIn(res, await auth.resetPassword(req.body));
}

export function logout(_req, res) {
  res.clearCookie("token", CLEAR_COOKIE_OPTIONS).json({ message: "Logged out." });
}

export async function me(req, res) {
  res.json({ user: auth.publicUser(await auth.getUser(req.userId)) });
}

export async function deleteAccount(req, res) {
  await auth.deleteAccount(req.userId, req.body.password);
  res.clearCookie("token", CLEAR_COOKIE_OPTIONS).json({ message: "Account deleted." });
}

export async function exportData(req, res) {
  const data = await auth.exportData(req.userId);
  res.setHeader("Content-Disposition", 'attachment; filename="cognispace-export.json"');
  res.json(data);
}
