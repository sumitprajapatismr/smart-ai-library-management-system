import { Schema, model, Document, Types } from 'mongoose';

export interface IReadingPlan extends Document {
  user: Types.ObjectId;
  bookTitle: string;
  totalPages: number;
  targetDays: number;
  dailyGoal: string;
  schedule: {
    day: number;
    task: string;
    duration: string;
  }[];
  progress: number; // 0 to 100
  createdAt: Date;
  updatedAt: Date;
}

const ReadingPlanSchema = new Schema<IReadingPlan>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookTitle: {
      type: String,
      required: true,
      trim: true,
    },
    totalPages: {
      type: Number,
      required: true,
      min: 1,
    },
    targetDays: {
      type: Number,
      required: true,
      min: 1,
    },
    dailyGoal: {
      type: String,
      required: true,
    },
    schedule: [
      {
        day: { type: Number, required: true },
        task: { type: String, required: true },
        duration: { type: String, default: '30 mins' },
      },
    ],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

export const ReadingPlan = model<IReadingPlan>('ReadingPlan', ReadingPlanSchema);
