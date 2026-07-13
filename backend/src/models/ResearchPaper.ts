import { Schema, model, Document } from 'mongoose';

export interface IResearchPaper extends Document {
  title: string;
  authors: string[];
  abstract: string;
  category: 'IEEE' | 'White Paper' | 'Case Study' | 'Project Report' | 'Technical Documentation' | 'Previous Year Question';
  pdfUrl: string;
  downloadsCount: number;
  tags: string[];
  semester?: number;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchPaperSchema = new Schema<IResearchPaper>(
  {
    title: {
      type: String,
      required: [true, 'Research paper title is required'],
      trim: true,
    },
    authors: {
      type: [String],
      required: [true, 'At least one author is required'],
    },
    abstract: {
      type: String,
      required: [true, 'Abstract is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['IEEE', 'White Paper', 'Case Study', 'Project Report', 'Technical Documentation', 'Previous Year Question'],
      required: true,
    },
    pdfUrl: {
      type: String,
      required: [true, 'Document PDF URL is required'],
    },
    downloadsCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    semester: {
      type: Number,
    },
    department: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ResearchPaper = model<IResearchPaper>('ResearchPaper', ResearchPaperSchema);
