import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Untitled Document", trim: true },
    content: { type: String, default: "<p></p>" },
    icon: { type: String, default: "📝" },
    cover: { type: String, default: null },
    status: {
      type: String,
      enum: ["In Progress", "Done", "In Review", "Backlog"],
      default: "In Progress",
    },
    priority: {
      type: String,
      enum: ["Urgent", "High", "Medium", "Low"],
      default: "Medium",
    },
    tags: [{ type: String, trim: true }],
    isStarred: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    isArchived: { type: Boolean, default: false, index: true },
    userId: { type: String, required: true, index: true },
    parentId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      },
    },
  }
);

documentSchema.index({ userId: 1, isArchived: 1, updatedAt: -1 });

export const Document = mongoose.model("Document", documentSchema);
export default Document;
