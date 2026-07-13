import { Schema, model, Document, Types } from 'mongoose';

export interface IDocumentChunk extends Document {
  document: Types.ObjectId;
  text: string;
  embedding: number[];
  pageNumber: number;
  chunkIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentChunkSchema = new Schema<IDocumentChunk>(
  {
    document: {
      type: Schema.Types.ObjectId,
      ref: 'ResearchDocument',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    pageNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const DocumentChunk = model<IDocumentChunk>('DocumentChunk', DocumentChunkSchema);
