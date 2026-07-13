import { Schema, model, Document, Types } from 'mongoose';

export interface IBorrowRecord extends Document {
  book: Types.ObjectId;
  user: Types.ObjectId;
  borrowDate?: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'requested' | 'borrowed' | 'returned' | 'overdue' | 'cancelled';
  fineAmount: number;
  progressPercent: number;
  notes: string;
  bookmarks: {
    _id?: Types.ObjectId;
    page: number;
    note: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const BorrowRecordSchema = new Schema<IBorrowRecord>(
  {
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    borrowDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 14 days borrow period
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['requested', 'borrowed', 'returned', 'overdue', 'cancelled'],
      default: 'requested',
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      default: '',
    },
    bookmarks: [
      {
        page: { type: Number, required: true },
        note: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const BorrowRecord = model<IBorrowRecord>('BorrowRecord', BorrowRecordSchema);
