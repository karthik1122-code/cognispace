import mongoose from "mongoose";

// Failed sign-ins per email and address. Stored in MongoDB so the lockout survives restarts and is shared
// by every server instance. MongoDB deletes each record automatically when `expiresAt` passes.
const loginAttemptSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
});

export const LoginAttempt = mongoose.model("LoginAttempt", loginAttemptSchema);
