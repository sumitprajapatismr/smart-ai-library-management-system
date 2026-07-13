import { Schema, model, Document } from 'mongoose';

export interface IAuthor extends Document {
  name: string;
  biography?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuthorSchema = new Schema<IAuthor>(
  {
    name: {
      type: String,
      required: [true, 'Author name is required'],
      unique: true,
      trim: true,
    },
    biography: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Author = model<IAuthor>('Author', AuthorSchema);
