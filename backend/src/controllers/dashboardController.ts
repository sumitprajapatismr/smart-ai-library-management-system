import { Response, NextFunction } from 'express';
import { Book } from '../models/Book';
import { User } from '../models/User';
import { BorrowRecord } from '../models/BorrowRecord';
import { Reservation } from '../models/Reservation';
import { Fine } from '../models/Fine';
import { Category } from '../models/Category';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';

// @desc    Get dashboard statistics for Admin/Librarian
// @route   GET /api/dashboard/staff
// @access  Private (Admin, Librarian)
export const getStaffDashboardStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const totalBooks = await Book.countDocuments({});
  const totalStudents = await User.countDocuments({ role: 'student' });
  const activeBorrows = await BorrowRecord.countDocuments({ status: 'borrowed' });
  const overdueBorrows = await BorrowRecord.countDocuments({
    $or: [
      { status: 'overdue' },
      { status: 'borrowed', dueDate: { $lt: new Date() } }
    ]
  });

  // Category distribution
  const categories = await Category.find({});
  const categoryStats = [];
  for (const cat of categories) {
    const count = await Book.countDocuments({ categories: cat._id });
    categoryStats.push({
      name: cat.name,
      count,
    });
  }

  // Monthly borrow trends (past 6 months)
  const borrowTrends = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date();
    start.setMonth(start.getMonth() - i);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const count = await BorrowRecord.countDocuments({
      createdAt: { $gte: start, $lt: end },
    });

    borrowTrends.push({
      month: start.toLocaleString('default', { month: 'short' }),
      borrows: count,
    });
  }

  res.status(200).json({
    success: true,
    stats: {
      totalBooks,
      totalStudents,
      activeBorrows,
      overdueBorrows,
    },
    categoryStats,
    borrowTrends,
  });
});

// @desc    Get student dashboard statistics
// @route   GET /api/dashboard/student
// @access  Private (Student)
export const getStudentDashboardStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  const activeBorrows = await BorrowRecord.countDocuments({
    user: userId,
    status: { $in: ['borrowed', 'overdue'] },
  });

  const pendingReservations = await Reservation.countDocuments({
    user: userId,
    status: 'pending',
  });

  const nextDueDateRecord = await BorrowRecord.findOne({
    user: userId,
    status: { $in: ['borrowed', 'overdue'] },
  }).sort({ dueDate: 1 });

  const nextDueDate = nextDueDateRecord ? nextDueDateRecord.dueDate : null;

  const user = await User.findById(userId);
  const wishlistCount = user?.wishlist.length || 0;
  const streak = user?.readingStreak || 0;
  const badges = user?.badges || [];

  const unpaidFinesResult = await Fine.aggregate([
    { $match: { user: req.user?._id, status: 'unpaid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const unpaidFinesAmount = unpaidFinesResult[0]?.total || 0;

  res.status(200).json({
    success: true,
    stats: {
      activeBorrows,
      pendingReservations,
      wishlistCount,
      unpaidFinesAmount,
      nextDueDate,
      streak,
      badges,
    },
  });
});

// @desc    Get management reports data
// @route   GET /api/dashboard/reports
// @access  Private (Admin, Librarian)
export const getReportsData = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Most Borrowed Books
  const mostBorrowed = await BorrowRecord.aggregate([
    { $group: { _id: '$book', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const populatedMostBorrowed = [];
  for (const item of mostBorrowed) {
    const book = await Book.findById(item._id).select('title coverImage isbn').populate('authors', 'name');
    if (book) {
      populatedMostBorrowed.push({
        book,
        borrowCount: item.count,
      });
    }
  }

  // 2. Overdue Books
  const overdueRecords = await BorrowRecord.find({
    $or: [
      { status: 'overdue' },
      { status: 'borrowed', dueDate: { $lt: new Date() } },
    ],
  })
    .populate('book', 'title isbn')
    .populate('user', 'name email')
    .sort({ dueDate: 1 })
    .limit(10);

  // 3. Fine Report
  const totalPaidFines = await Fine.aggregate([
    { $match: { status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalUnpaidFines = await Fine.aggregate([
    { $match: { status: 'unpaid' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  res.status(200).json({
    success: true,
    reports: {
      mostBorrowed: populatedMostBorrowed,
      overdueRecords,
      finesSummary: {
        paid: totalPaidFines[0]?.total || 0,
        unpaid: totalUnpaidFines[0]?.total || 0,
      },
    },
  });
});

import { sendEmail } from '../config/mail';

export const submitContactForm = asyncHandler(async (req: any, res: Response, next: NextFunction) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return next(new AppError('All fields are required', 400));
  }

  const emailHtml = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `;

  try {
    await sendEmail('prajapatisumitop@gmail.com', `Contact Form: ${subject}`, emailHtml);
  } catch (err) {
    console.error('Contact email failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Message sent successfully. Sumit will get back to you shortly!',
  });
});
