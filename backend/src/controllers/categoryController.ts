import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
});

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private (Admin, Librarian)
export const createCategory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = categorySchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { name, description } = result.data;

  const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (categoryExists) {
    return next(new AppError('Category already exists', 400));
  }

  const category = await Category.create({ name, description });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    category,
  });
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const categories = await Category.find({}).sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    categories,
  });
});

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    category,
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin, Librarian)
export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = categorySchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  const { name, description } = result.data;

  // Check if name is taken by another category
  if (name !== category.name) {
    const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (categoryExists) {
      return next(new AppError('Another category already exists with that name', 400));
    }
  }

  category.name = name;
  if (description !== undefined) category.description = description;

  await category.save();

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    category,
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin, Librarian)
export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('Category not found', 404));
  }

  await Category.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully',
  });
});
