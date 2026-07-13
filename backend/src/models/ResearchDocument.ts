import { Schema, model, Document, Types } from 'mongoose';

export interface IResearchDocument extends Document {
  title: string;
  filename: string;
  fileSize: number;
  pageCount: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchDocumentSchema = new Schema<IResearchDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    pageCount: {
      type: Number,
      required: true,
      default: 1,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ResearchDocument = model<IResearchDocument>('ResearchDocument', ResearchDocumentSchema);
