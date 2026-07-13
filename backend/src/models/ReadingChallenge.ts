import { Schema, model, Document, Types } from 'mongoose';

export interface IReadingChallenge extends Document {
  user: Types.ObjectId;
  startDate: Date;
  completedDays: number;
  pagesRead: number;
  badgeAwarded?: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const ReadingChallengeSchema = new Schema<IReadingChallenge>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    completedDays: {
      type: Number,
      default: 0,
    },
    pagesRead: {
      type: Number,
      default: 0,
    },
    badgeAwarded: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export const ReadingChallenge = model<IReadingChallenge>('ReadingChallenge', ReadingChallengeSchema);
