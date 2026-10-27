import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    // Bumped when the password changes, so every older session cookie stops working.
    sessionVersion: { type: Number, default: 0 },
    // Only a SHA-256 hash of the reset token is stored; the token itself exists only in the email.
    resetTokenHash: { type: String, default: null, index: true },
    resetTokenExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.password;
        return ret;
      },
    },
  }
);

export const User = mongoose.model("User", userSchema);
export default User;
