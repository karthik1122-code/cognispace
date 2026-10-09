import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    version: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
versionSchema.index({ documentId: 1, createdAt: -1 });

export const DocumentVersion = mongoose.model("DocumentVersion", versionSchema);
export default DocumentVersion;
