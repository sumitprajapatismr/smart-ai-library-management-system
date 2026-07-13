import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Review } from '../models/Review';
import { Book } from '../models/Book';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';

const reviewSchema = z.object({
  rating: z.coerce.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(3, 'Review comment must be at least 3 characters'),
});

// Helper: Recalculate book rating & review count
const updateBookRatingStats = async (bookId: string) => {
  const reviews = await Review.find({ book: bookId });
  const reviewCount = reviews.length;
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;

  await Book.findByIdAndUpdate(bookId, {
    rating: averageRating,
    reviewCount,
  });
};

// @desc    Add or update a book review
// @route   POST /api/reviews/:bookId
// @access  Private (Student)
export const addReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookId } = req.params;
  const userId = req.user?.id;

  const result = reviewSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { rating, comment } = result.data;

  const book = await Book.findById(bookId);
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  // Check if review already exists
  let review = await Review.findOne({ book: bookId, user: userId });

  if (review) {
    // Update existing review
    review.rating = rating;
    review.comment = comment;
    await review.save();
  } else {
    // Create new review
    review = await Review.create({
      book: bookId,
      user: userId,
      rating,
      comment,
    });
  }

  // Recalculate book statistics
  await updateBookRatingStats(bookId);

  res.status(200).json({
    success: true,
    message: 'Review saved successfully',
    review,
  });
});

// @desc    Get reviews for a single book
// @route   GET /api/reviews/:bookId
// @access  Public
export const getBookReviews = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookId } = req.params;

  const reviews = await Review.find({ book: bookId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reviews.length,
    reviews,
  });
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Student, Admin)
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Allow only the author of the review or an admin to delete it
  if (req.user?.role !== 'admin' && review.user.toString() !== req.user?.id) {
    return next(new AppError('You are not authorized to delete this review', 403));
  }

  const bookId = review.book.toString();
  await Review.findByIdAndDelete(req.params.id);

  // Recalculate book statistics
  await updateBookRatingStats(bookId);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
});
