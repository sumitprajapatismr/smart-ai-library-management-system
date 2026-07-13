import { Schema, model, Document, Types } from 'mongoose';

export interface IReservation extends Document {
  book: Types.ObjectId;
  user: Types.ObjectId;
  requestDate: Date;
  status: 'pending' | 'approved' | 'cancelled' | 'expired';
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
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
    requestDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'cancelled', 'expired'],
      default: 'pending',
    },
    expiryDate: {
      type: Date, // Date by which reservation must be claimed (e.g. 3 days after approval)
    },
  },
  {
    timestamps: true,
  }
);

export const Reservation = model<IReservation>('Reservation', ReservationSchema);
