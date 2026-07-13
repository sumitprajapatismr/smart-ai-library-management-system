import { Schema, model, Document, Types } from 'mongoose';

export interface IFine extends Document {
  user: Types.ObjectId;
  borrowRecord: Types.ObjectId;
  amount: number;
  status: 'unpaid' | 'paid';
  paymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FineSchema = new Schema<IFine>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    borrowRecord: {
      type: Schema.Types.ObjectId,
      ref: 'BorrowRecord',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    paymentDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Fine = model<IFine>('Fine', FineSchema);
