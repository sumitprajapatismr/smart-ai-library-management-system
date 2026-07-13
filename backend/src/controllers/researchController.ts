import { Response, NextFunction } from 'express';
import { ResearchPaper } from '../models/ResearchPaper';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';

// @desc    Get all research papers with filters
// @route   GET /api/research
// @access  Private
export const getAllPapers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { category, search, semester, department } = req.query;
  const query: any = {};

  if (category) {
    query.category = category;
  }
  if (semester) {
    query.semester = parseInt(semester as string);
  }
  if (department) {
    query.department = department;
  }
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { authors: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  const papers = await ResearchPaper.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: papers.length,
    papers
  });
});

// @desc    Bookmark or unbookmark a research paper
// @route   POST /api/research/bookmark/:paperId
// @access  Private (Student)
export const bookmarkPaper = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { paperId } = req.params;
  const userId = req.user?.id;

  const paper = await ResearchPaper.findById(paperId);
  if (!paper) {
    return next(new AppError('Research paper not found', 404));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isBookmarked = user.bookmarkedPapers.includes(paper._id as any);
  if (isBookmarked) {
    // Unbookmark
    user.bookmarkedPapers = user.bookmarkedPapers.filter(id => id.toString() !== paperId);
  } else {
    // Bookmark
    user.bookmarkedPapers.push(paper._id as any);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: isBookmarked ? 'Paper removed from bookmarks' : 'Paper bookmarked successfully',
    bookmarked: !isBookmarked
  });
});

// @desc    Get user bookmarked papers
// @route   GET /api/research/bookmarks
// @access  Private (Student)
export const getMyBookmarkedPapers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const user = await User.findById(userId).populate('bookmarkedPapers');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    papers: user.bookmarkedPapers
  });
});

// @desc    Create a research paper
// @route   POST /api/research
// @access  Private (Admin, Librarian)
export const createResearchPaper = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, authors, abstract, category, pdfUrl, tags, semester, department } = req.body;

  if (!title || !authors || !abstract || !category || !pdfUrl) {
    return next(new AppError('Please provide title, authors, abstract, category, and pdfUrl', 400));
  }

  const paper = await ResearchPaper.create({
    title,
    authors: Array.isArray(authors) ? authors : [authors],
    abstract,
    category,
    pdfUrl,
    tags: tags || [],
    semester,
    department
  });

  res.status(201).json({
    success: true,
    message: 'Research paper entry created successfully',
    paper
  });
});
