import mongoose, { Schema, type Document as MongooseDoc, type Model } from 'mongoose';

export interface IDocument {
  title: string;
  content: string;
  userId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  isArchived: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDocumentInstance extends IDocument, MongooseDoc {}

const DocumentSchema = new Schema<IDocumentInstance>(
  {
    title: {
      type: String,
      default: 'Untitled Page',
      trim: true,
    },
    // Stores the raw HTML exported by Tiptap's editor.getHTML()
    content: {
      type: String,
      default: '<p></p>',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for fast workspace document tree queries
DocumentSchema.index({ userId: 1, isArchived: 1, updatedAt: -1 });

export const Document: Model<IDocumentInstance> = 
  mongoose.models.Document || mongoose.model<IDocumentInstance>('Document', DocumentSchema);

export default Document;
