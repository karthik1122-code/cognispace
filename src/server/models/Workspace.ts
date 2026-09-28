import { Schema, model, Document, type Types, type Model } from 'mongoose';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface IWorkspaceMember {
  userId: Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface IWorkspace {
  title: string;
  slug: string;
  ownerId: Types.ObjectId;
  members: IWorkspaceMember[];
  icon?: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceDocument extends IWorkspace, Document {}

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: {
        values: ['owner', 'editor', 'viewer'],
        message: '{VALUE} is not a valid workspace role',
      },
      default: 'editor',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const workspaceSchema = new Schema<IWorkspaceDocument>(
  {
    title: {
      type: String,
      required: [true, 'Workspace title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Workspace slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    members: {
      type: [workspaceMemberSchema],
      default: [],
    },
    icon: {
      type: String,
      default: '⚡',
    },
    plan: {
      type: String,
      enum: ['Free', 'Pro', 'Enterprise'],
      default: 'Pro',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for finding user's workspaces quickly
workspaceSchema.index({ 'members.userId': 1, updatedAt: -1 });

export const Workspace: Model<IWorkspaceDocument> = model<IWorkspaceDocument>(
  'Workspace',
  workspaceSchema
);

export default Workspace;
