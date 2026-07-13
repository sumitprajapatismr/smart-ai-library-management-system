import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Author } from '../models/Author';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';

const authorSchema = z.object({
  name: z.string().min(2, 'Author name must be at least 2 characters'),
  biography: z.string().optional(),
});

// @desc    Create a new author
// @route   POST /api/authors
// @access  Private (Admin, Librarian)
export const createAuthor = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = authorSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { name, biography } = result.data;

  const authorExists = await Author.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (authorExists) {
    return next(new AppError('Author already exists', 400));
  }

  const author = await Author.create({ name, biography });

  res.status(201).json({
    success: true,
    message: 'Author created successfully',
    author,
  });
});

// @desc    Get all authors
// @route   GET /api/authors
// @access  Public
export const getAuthors = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authors = await Author.find({}).sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: authors.length,
    authors,
  });
});

// @desc    Get single author by ID
// @route   GET /api/authors/:id
// @access  Public
export const getAuthor = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const author = await Author.findById(req.params.id);
  if (!author) {
    return next(new AppError('Author not found', 404));
  }

  res.status(200).json({
    success: true,
    author,
  });
});

// @desc    Update author
// @route   PUT /api/authors/:id
// @access  Private (Admin, Librarian)
export const updateAuthor = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = authorSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const author = await Author.findById(req.params.id);
  if (!author) {
    return next(new AppError('Author not found', 404));
  }

  const { name, biography } = result.data;

  if (name !== author.name) {
    const authorExists = await Author.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (authorExists) {
      return next(new AppError('Another author already exists with that name', 400));
    }
  }

  author.name = name;
  if (biography !== undefined) author.biography = biography;

  await author.save();

  res.status(200).json({
    success: true,
    message: 'Author updated successfully',
    author,
  });
});

// @desc    Delete author
// @route   DELETE /api/authors/:id
// @access  Private (Admin, Librarian)
export const deleteAuthor = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const author = await Author.findById(req.params.id);
  if (!author) {
    return next(new AppError('Author not found', 404));
  }

  await Author.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Author deleted successfully',
  });
});
