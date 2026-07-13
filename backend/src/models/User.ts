import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'librarian' | 'student';
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  wishlist: Types.ObjectId[];
  bookmarkedPapers: Types.ObjectId[];
  readingStreak: number;
  lastActiveDate?: Date;
  badges: string[];
  semester?: number;
  department?: string;
  cgpa?: number;
  skills: string[];
  interests: string[];
  careerGoal?: string;
  preferredTechnologies: string[];
  projects: string[];
  certificates: string[];
  readingHours: number;
  completedBooksCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Prevents password from being returned by default queries
    },
    role: {
      type: String,
      enum: ['admin', 'librarian', 'student'],
      default: 'student',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    wishlist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
    bookmarkedPapers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'ResearchPaper',
      },
    ],
    readingStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
    },
    badges: {
      type: [String],
      default: ['Book Worm'],
    },
    semester: {
      type: Number,
    },
    department: {
      type: String,
      trim: true,
    },
    cgpa: {
      type: Number,
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    careerGoal: {
      type: String,
      trim: true,
    },
    preferredTechnologies: {
      type: [String],
      default: [],
    },
    projects: {
      type: [String],
      default: [],
    },
    certificates: {
      type: [String],
      default: [],
    },
    readingHours: {
      type: Number,
      default: 0,
    },
    completedBooksCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', UserSchema);
