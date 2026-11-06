import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { Document } from "../models/Document.js";
import { Task } from "../models/Task.js";
import { DocumentVersion } from "../models/DocumentVersion.js";
import { APP_URL, RESET_TOKEN_TTL_MS } from "../config.js";
import { sendEmail } from "./email.js";
import { seedUserStarterData } from "./seed.js";
import { HttpError, badRequest, conflict, notFound, unauthorized } from "../lib/httpError.js";

// Accounts: sign-up, sign-in, password reset, account deletion and export. No req/res in here.
export const publicUser = (u) => ({ id: u._id.toString(), name: u.name, email: u.email, demo: Boolean(u.demo) });
export const DEMO_TTL_MS = 24 * 60 * 60 * 1000;
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

export async function register({ name, email, password }) {
  if (await User.exists({ email })) throw conflict("An account with that email already exists.");
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 12) });
  await seedUserStarterData(user._id.toString(), user.name);
  return user;
}

// "Try the demo": a fresh, private workspace per visitor with the starter pages and tasks, so no one sees anyone
// else's edits. Its password is random and never shown, so no one can sign in to it later.
export async function createDemo() {
  await deleteOldDemos();
  const user = await User.create({
    name: "Demo visitor",
    email: `demo-${crypto.randomBytes(6).toString("hex")}@demo.cognispace.app`,
    password: await bcrypt.hash(crypto.randomBytes(24).toString("base64url"), 10),
    demo: true,
  });
  await seedUserStarterData(user._id.toString(), "Demo visitor");
  return user;
}

/** Deletes demo workspaces older than a day, with everything in them. */
export async function deleteOldDemos(now = Date.now()) {
  const old = await User.find({ demo: true, createdAt: { $lt: new Date(now - DEMO_TTL_MS) } }).select("_id").lean();
  if (!old.length) return 0;
  const ids = old.map((u) => u._id);
  const userIds = ids.map(String);
  await Promise.all([
    DocumentVersion.deleteMany({ userId: { $in: userIds } }),
    Document.deleteMany({ userId: { $in: userIds } }),
    Task.deleteMany({ userId: { $in: userIds } }),
    User.deleteMany({ _id: { $in: ids } }),
  ]);
  return ids.length;
}

/** Returns the user, or null for a wrong email or password (same result for both, so emails stay private). */
export async function checkCredentials({ email, password }) {
  const user = await User.findOne({ email });
  const ok = user ? await bcrypt.compare(password, user.password) : false;
  return ok ? user : null;
}

// Emails a single-use link. Silent when the email has no account, so it cannot be used to find accounts.
export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  if (!user) return;
  const token = crypto.randomBytes(32).toString("base64url");
  user.resetTokenHash = sha256(token);
  user.resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();
  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your CogniSpace password",
      text: `Hi ${user.name},\n\nUse this link to choose a new password. It works for 30 minutes and only once:\n${APP_URL}/?reset=${token}\n\nIf you did not ask for this, ignore this email; your password stays the same.`,
    });
  } catch (err) {
    console.error("Password reset email failed:", err.message);
  }
}

// Sets the new password and bumps sessionVersion, which signs out every other device.
export async function resetPassword({ token, password }) {
  const user = await User.findOne({ resetTokenHash: sha256(token), resetTokenExpires: { $gt: new Date() } });
  if (!user) throw badRequest("This reset link is invalid or has expired. Ask for a new one.");
  user.password = await bcrypt.hash(password, 12);
  user.resetTokenHash = null;
  user.resetTokenExpires = null;
  user.sessionVersion = (user.sessionVersion || 0) + 1;
  await user.save();
  return user;
}

export async function getUser(userId) {
  // A valid token for an account that no longer exists is treated as signed out.
  const user = await User.findById(userId).select("-password");
  if (!user) throw unauthorized("Invalid or expired session.");
  return user;
}

// Permanently deletes the account and all its data. Needs the current password, so a stolen session cannot wipe it.
export async function deleteAccount(userId, password) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found.");
  if (!(await bcrypt.compare(password, user.password))) throw new HttpError(401, "Incorrect password.");
  await Promise.all([
    DocumentVersion.deleteMany({ userId }),
    Document.deleteMany({ userId }),
    Task.deleteMany({ userId }),
    User.deleteOne({ _id: user._id }),
  ]);
}

// Everything the user owns, as one JSON object (data portability).
export async function exportData(userId) {
  const [user, documents, tasks] = await Promise.all([
    User.findById(userId).select("-password").lean(),
    Document.find({ userId }).lean(),
    Task.find({ userId }).lean(),
  ]);
  if (!user) throw notFound("User not found.");
  return { exportedAt: new Date().toISOString(), user: { name: user.name, email: user.email }, documents, tasks };
}
