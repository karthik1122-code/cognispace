import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
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
    assignee: { type: String, default: "You" },
    dueDate: { type: String, default: "Tomorrow" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    userId: { type: String, required: true, index: true },
    documentId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
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

taskSchema.index({ userId: 1, createdAt: -1 });

export const Task = mongoose.model("Task", taskSchema);
export default Task;
