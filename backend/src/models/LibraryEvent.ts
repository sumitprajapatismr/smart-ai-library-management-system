import { Schema, model, Document, Types } from 'mongoose';

export interface ILibraryEvent extends Document {
  title: string;
  description: string;
  type: 'Book Fair' | 'Workshop' | 'Seminar' | 'Coding Contest' | 'Hackathon' | 'Guest Lecture';
  date: Date;
  location: string;
  registrations: Types.ObjectId[];
  attendees: Types.ObjectId[];
  speaker: string;
  capacity?: number;
  schedule: { time: string; activity: string }[];
  certificateTemplateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LibraryEventSchema = new Schema<ILibraryEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Book Fair', 'Workshop', 'Seminar', 'Coding Contest', 'Hackathon', 'Guest Lecture'],
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    location: {
      type: String,
      required: [true, 'Event location is required'],
    },
    speaker: {
      type: String,
      required: [true, 'Event speaker is required'],
    },
    capacity: {
      type: Number,
    },
    attendees: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    registrations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    schedule: [
      {
        time: { type: String, required: true },
        activity: { type: String, required: true },
      },
    ],
    certificateTemplateUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const LibraryEvent = model<ILibraryEvent>('LibraryEvent', LibraryEventSchema);
