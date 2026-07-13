import { Response, NextFunction } from 'express';
import { Fine } from '../models/Fine';
import { BorrowRecord } from '../models/BorrowRecord';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';
import { emitNotification } from '../config/socket';

// @desc    Get fines for current student
// @route   GET /api/fines/my-fines
// @access  Private (Student)
export const getMyFines = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  const fines = await Fine.find({ user: userId })
    .populate({
      path: 'borrowRecord',
      populate: { path: 'book' },
    })
    .sort({ createdAt: -1 });

  const totalUnpaidAmount = fines
    .filter(f => f.status === 'unpaid')
    .reduce((sum, f) => sum + f.amount, 0);

  res.status(200).json({
    success: true,
    count: fines.length,
    totalUnpaidAmount,
    fines,
  });
});

// @desc    Pay fine (simulated payment)
// @route   PUT /api/fines/pay/:fineId
// @access  Private (Student)
export const payFine = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { fineId } = req.params;
  const userId = req.user?.id;

  const fine = await Fine.findOne({ _id: fineId, user: userId }).populate('borrowRecord');
  if (!fine) {
    return next(new AppError('Fine record not found for this user', 404));
  }

  if (fine.status === 'paid') {
    return next(new AppError('Fine has already been paid', 400));
  }

  // Update Fine status
  fine.status = 'paid';
  fine.paymentDate = new Date();
  await fine.save();

  // Optionally set the fineAmount of the BorrowRecord to 0 (or leave it as historical reference)
  // Let's keep it as historical reference but mark the fine as resolved.

  // Notify user
  await Notification.create({
    user: userId,
    message: `Payment of $${fine.amount.toFixed(2)} received. Fine cleared.`,
    type: 'system',
  });

  emitNotification(userId, 'fine_paid', `Payment of $${fine.amount.toFixed(2)} received. Fine cleared.`);

  res.status(200).json({
    success: true,
    message: 'Fine paid successfully',
    fine,
  });
});

// @desc    Get all fines (with pagination and status filter)
// @route   GET /api/fines
// @access  Private (Admin, Librarian)
export const getAllFines = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string || '';

  const query: any = {};
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  const fines = await Fine.find(query)
    .populate('user', 'name email')
    .populate({
      path: 'borrowRecord',
      populate: { path: 'book', select: 'title' },
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Fine.countDocuments(query);

  res.status(200).json({
    success: true,
    count: fines.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    fines,
  });
});
