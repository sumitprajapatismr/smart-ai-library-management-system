import { Schema, model, Document, Types } from 'mongoose';

export interface IStudyRoomReservation extends Document {
  user: Types.ObjectId;
  roomName: string;
  date: Date;
  slot: string;
  status: 'pending' | 'approved' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const StudyRoomReservationSchema = new Schema<IStudyRoomReservation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomName: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Reservation date is required'],
    },
    slot: {
      type: String,
      required: [true, 'Reservation time slot is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'cancelled'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

export const StudyRoomReservation = model<IStudyRoomReservation>('StudyRoomReservation', StudyRoomReservationSchema);
