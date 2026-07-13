import { Schema, model, Document, Types } from 'mongoose';

export interface IBook extends Document {
  title: string;
  subtitle?: string;
  authors: Types.ObjectId[];
  categories: Types.ObjectId[];
  isbn: string;
  description: string;
  summary?: string;
  keyPoints?: string[];
  coverImage?: string;
  pdfUrl?: string;
  audioUrl?: string;
  isEbook: boolean;
  isAudiobook: boolean;
  totalCopies: number;
  copiesAvailable: number;
  status: 'available' | 'borrowed' | 'reserved' | 'unavailable';
  condition: 'New' | 'Good' | 'Fair' | 'Damaged';
  damageHistory: { date: Date; description: string; reportedBy: string }[];
  estimatedLifetimeYears: number;
  replacementRecommendation: boolean;
  lastBorrowedAt?: Date;
  lastReturnedAt?: Date;
  borrowFrequency: number;
  popularityScore: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedReadingTimeMinutes: number;
  requiredKnowledge: string[];
  programmingLevel: 'None' | 'Beginner' | 'Intermediate' | 'Expert';
  mathematicsLevel: 'None' | 'Basic' | 'Intermediate' | 'Advanced';
  careerRelevance?: string;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    authors: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Author',
        required: true,
      },
    ],
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
      },
    ],
    isbn: {
      type: String,
      required: [true, 'ISBN code is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    keyPoints: [
      {
        type: String,
      },
    ],
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    },
    totalCopies: {
      type: Number,
      required: true,
      default: 1,
      min: [0, 'Total copies cannot be negative'],
    },
    copiesAvailable: {
      type: Number,
      required: true,
      default: 1,
      min: [0, 'Available copies cannot be negative'],
    },
    status: {
      type: String,
      enum: ['available', 'borrowed', 'reserved', 'unavailable'],
      default: 'available',
    },
    pdfUrl: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
    isEbook: {
      type: Boolean,
      default: false,
    },
    isAudiobook: {
      type: Boolean,
      default: false,
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Damaged'],
      default: 'New',
    },
    damageHistory: [
      {
        date: { type: Date, default: Date.now },
        description: { type: String, required: true },
        reportedBy: { type: String, required: true },
      }
    ],
    estimatedLifetimeYears: {
      type: Number,
      default: 5,
    },
    replacementRecommendation: {
      type: Boolean,
      default: false,
    },
    lastBorrowedAt: {
      type: Date,
    },
    lastReturnedAt: {
      type: Date,
    },
    borrowFrequency: {
      type: Number,
      default: 0,
    },
    popularityScore: {
      type: Number,
      default: 0,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },
    estimatedReadingTimeMinutes: {
      type: Number,
      default: 120,
    },
    requiredKnowledge: {
      type: [String],
      default: [],
    },
    programmingLevel: {
      type: String,
      enum: ['None', 'Beginner', 'Intermediate', 'Expert'],
      default: 'None',
    },
    mathematicsLevel: {
      type: String,
      enum: ['None', 'Basic', 'Intermediate', 'Advanced'],
      default: 'None',
    },
    careerRelevance: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to automatically update availability status based on copiesAvailable
BookSchema.pre<IBook>('save', function (next) {
  if (this.copiesAvailable === 0) {
    if (this.status !== 'reserved' && this.status !== 'unavailable') {
      this.status = 'borrowed';
    }
  } else {
    if (this.status === 'borrowed') {
      this.status = 'available';
    }
  }
  next();
});

export const Book = model<IBook>('Book', BookSchema);
