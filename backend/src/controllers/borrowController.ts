import { Response, NextFunction } from 'express';
import { BorrowRecord } from '../models/BorrowRecord';
import { Book } from '../models/Book';
import { Fine } from '../models/Fine';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';
import { calculateFine } from '../utils/fineCalculator';
import { sendEmail } from '../config/mail';
import { emitNotification } from '../config/socket';

// @desc    Student requests to borrow a book
// @route   POST /api/borrows/request/:bookId
// @access  Private (Student)
export const requestBorrowBook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookId } = req.params;
  const userId = req.user?.id;

  const book = await Book.findById(bookId);
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  if (book.copiesAvailable === 0) {
    return next(new AppError('No copies available for borrowing. You can reserve this book instead.', 400));
  }

  // Check if student has already requested/borrowed this book
  const activeRecord = await BorrowRecord.findOne({
    book: bookId,
    user: userId,
    status: { $in: ['requested', 'borrowed', 'overdue'] },
  });

  if (activeRecord) {
    return next(new AppError('You have already requested or borrowed this book.', 400));
  }

  const record = await BorrowRecord.create({
    book: bookId,
    user: userId,
    status: 'requested',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 14 days
  });

  // Notify Librarians (simulated notification or just log)
  await Notification.create({
    user: userId,
    message: `You successfully requested to borrow "${book.title}". Wait for librarian approval.`,
    type: 'borrow',
  });

  emitNotification(userId, 'borrow_request', `You successfully requested to borrow "${book.title}". Wait for librarian approval.`);

  res.status(201).json({
    success: true,
    message: 'Borrow request submitted successfully',
    record,
  });
});

// @desc    Librarian approves/issues a borrow request
// @route   PUT /api/borrows/approve/:recordId
// @access  Private (Admin, Librarian)
export const approveBorrowRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { recordId } = req.params;

  const record = await BorrowRecord.findById(recordId).populate('book').populate('user');
  if (!record) {
    return next(new AppError('Borrow record not found', 404));
  }

  if (record.status !== 'requested') {
    return next(new AppError('Only pending borrow requests can be approved', 400));
  }

  const book = await Book.findById(record.book._id);
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  if (book.copiesAvailable === 0) {
    return next(new AppError('No copies available of this book at this moment', 400));
  }

  // Update book availability
  book.copiesAvailable -= 1;
  await book.save();

  // Update borrow record
  record.status = 'borrowed';
  record.borrowDate = new Date();
  record.dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from approval
  await record.save();

  const user = record.user as any;

  // Notify student
  await Notification.create({
    user: user._id,
    message: `Your borrow request for "${book.title}" was approved. Due date is ${record.dueDate.toLocaleDateString()}.`,
    type: 'borrow',
  });

  emitNotification(user._id, 'borrow_success', `Your borrow request for "${book.title}" was approved. Due date is ${record.dueDate.toLocaleDateString()}.`);

  // Send approval email
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Book Issued!</h2>
      <p>Hi ${user.name},</p>
      <p>Your borrow request for the book <strong>${book.title}</strong> has been approved.</p>
      <p><strong>Due Date:</strong> ${record.dueDate.toLocaleDateString()}</p>
      <p>Please return it by the due date to avoid late fees.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin-top: 30px;" />
      <p style="font-size: 12px; color: #888888; text-align: center;">Smart Library System. All rights reserved.</p>
    </div>
  `;
  await sendEmail(user.email, 'Book Issued - Smart Library', emailHtml);

  res.status(200).json({
    success: true,
    message: 'Borrow request approved and book issued',
    record,
  });
});

// @desc    Librarian cancels/rejects a borrow request
// @route   PUT /api/borrows/cancel/:recordId
// @access  Private (Admin, Librarian)
export const rejectBorrowRequest = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { recordId } = req.params;

  const record = await BorrowRecord.findById(recordId).populate('book').populate('user');
  if (!record) {
    return next(new AppError('Borrow record not found', 404));
  }

  if (record.status !== 'requested') {
    return next(new AppError('Only pending borrow requests can be cancelled/rejected', 400));
  }

  record.status = 'cancelled';
  await record.save();

  const user = record.user as any;
  const book = record.book as any;

  // Notify student
  await Notification.create({
    user: user._id,
    message: `Your borrow request for "${book.title}" was rejected.`,
    type: 'borrow',
  });

  emitNotification(user._id, 'borrow_rejected', `Your borrow request for "${book.title}" was rejected.`);

  res.status(200).json({
    success: true,
    message: 'Borrow request rejected',
    record,
  });
});

// @desc    Librarian marks a book as returned
// @route   PUT /api/borrows/return/:recordId
// @access  Private (Admin, Librarian)
export const returnBook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { recordId } = req.params;

  const record = await BorrowRecord.findById(recordId).populate('book').populate('user');
  if (!record) {
    return next(new AppError('Borrow record not found', 404));
  }

  if (record.status !== 'borrowed' && record.status !== 'overdue') {
    return next(new AppError('This book is not currently borrowed', 400));
  }

  const book = await Book.findById(record.book._id);
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  // Update book availability
  book.copiesAvailable += 1;
  await book.save();

  // Calculate dynamic fine
  const fineAmount = calculateFine(record.dueDate, new Date());
  
  // Update borrow record status
  record.status = 'returned';
  record.returnDate = new Date();
  record.fineAmount = fineAmount;
  await record.save();

  const user = record.user as any;

  // If there's an overdue fine, record it
  if (fineAmount > 0) {
    await Fine.create({
      user: user._id,
      borrowRecord: record._id,
      amount: fineAmount,
      status: 'unpaid',
    });

    // Notify student about fine
    await Notification.create({
      user: user._id,
      message: `You returned "${book.title}" late. An overdue fine of $${fineAmount.toFixed(2)} has been charged.`,
      type: 'due',
    });

    emitNotification(user._id, 'fine', `You returned "${book.title}" late. An overdue fine of $${fineAmount.toFixed(2)} has been charged.`);

    // Send fine email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #ef4444; text-align: center;">Overdue Fine Notice</h2>
        <p>Hi ${user.name},</p>
        <p>You returned the book <strong>${book.title}</strong> after the due date.</p>
        <p><strong>Due Date:</strong> ${record.dueDate.toLocaleDateString()}</p>
        <p><strong>Return Date:</strong> ${record.returnDate.toLocaleDateString()}</p>
        <p style="font-size: 18px; color: #ef4444;"><strong>Fine Charged:</strong> $${fineAmount.toFixed(2)}</p>
        <p>Please pay your fine at the library dashboard to clear your account status.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin-top: 30px;" />
        <p style="font-size: 12px; color: #888888; text-align: center;">Smart Library System. All rights reserved.</p>
      </div>
    `;
    await sendEmail(user.email, 'Overdue Fine Notice - Smart Library', emailHtml);
  } else {
    // Standard return notification
    await Notification.create({
      user: user._id,
      message: `You returned "${book.title}" successfully. Thank you!`,
      type: 'borrow',
    });

    emitNotification(user._id, 'return_success', `You returned "${book.title}" successfully. Thank you!`);
  }

  res.status(200).json({
    success: true,
    message: 'Book returned successfully',
    record,
    fineAmount,
  });
});

// @desc    Get borrowing history for authenticated student
// @route   GET /api/borrows/my-history
// @access  Private (Student)
export const getMyBorrowHistory = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const records = await BorrowRecord.find({ user: userId })
    .populate('book')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await BorrowRecord.countDocuments({ user: userId });

  res.status(200).json({
    success: true,
    count: records.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    records,
  });
});

// @desc    Get all borrow records
// @route   GET /api/borrows
// @access  Private (Admin, Librarian)
export const getAllBorrowRecords = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string || '';
  const search = req.query.search as string || '';

  const query: any = {};

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  // If search is supplied, we need to lookup users/books by search query
  let finalQuery = query;
  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    const userIds = matchingUsers.map((u: any) => u._id);

    const matchingBooks = await Book.find({
      title: { $regex: search, $options: 'i' },
    }).select('_id');
    const bookIds = matchingBooks.map(b => b._id);

    finalQuery = {
      ...query,
      $or: [
        { user: { $in: userIds } },
        { book: { $in: bookIds } },
      ],
    };
  }

  const records = await BorrowRecord.find(finalQuery)
    .populate('book')
    .populate('user')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await BorrowRecord.countDocuments(finalQuery);

  // Dynamically update fine amount for borrowed records that are overdue
  const updatedRecords = records.map(record => {
    const recordObj = record.toObject();
    if (recordObj.status === 'borrowed' && new Date(recordObj.dueDate) < new Date()) {
      recordObj.status = 'overdue';
      recordObj.fineAmount = calculateFine(new Date(recordObj.dueDate));
    }
    return recordObj;
  });

  res.status(200).json({
    success: true,
    count: updatedRecords.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    records: updatedRecords,
  });
});

export const updateReadingStreak = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!user.lastActiveDate) {
    user.readingStreak = 1;
  } else {
    const lastActive = new Date(user.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      user.readingStreak += 1;
    } else if (diffDays > 1) {
      user.readingStreak = 1;
    }
  }

  user.lastActiveDate = new Date();

  // Award badges based on streak/gamification
  const currentBadges = user.badges || [];
  if (user.readingStreak >= 3 && !currentBadges.includes('Fast Reader')) {
    user.badges.push('Fast Reader');
  }
  if (user.readingStreak >= 7 && !currentBadges.includes('Book Worm')) {
    user.badges.push('Book Worm');
  }

  await user.save();
};

export const qrBorrow = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookId } = req.body;
  const userId = req.user?.id;

  const book = await Book.findById(bookId);
  if (!book) return next(new AppError('Book not found', 404));
  if (book.copiesAvailable <= 0) return next(new AppError('Book is out of stock', 400));

  const activeRecord = await BorrowRecord.findOne({
    book: bookId,
    user: userId,
    status: { $in: ['requested', 'borrowed', 'overdue'] },
  });

  if (activeRecord) {
    return next(new AppError('You have already requested or borrowed this book.', 400));
  }

  const record = await BorrowRecord.create({
    book: bookId,
    user: userId,
    status: 'borrowed',
    borrowDate: new Date(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  });

  book.copiesAvailable -= 1;
  await book.save();

  await updateReadingStreak(userId);

  // Gamification triggers
  const user = await User.findById(userId);
  if (user) {
    if (book.title.toLowerCase().includes('java') && !user.badges.includes('Java Expert')) {
      user.badges.push('Java Expert');
    }
    const borrowCount = await BorrowRecord.countDocuments({ user: userId });
    if (borrowCount >= 5 && !user.badges.includes('Top Reader')) {
      user.badges.push('Top Reader');
    }
    await user.save();
  }

  await Notification.create({
    user: userId,
    message: `Quick QR Borrow approved for "${book.title}". Due date is ${record.dueDate.toLocaleDateString()}.`,
    type: 'borrow',
  });

  emitNotification(userId, 'borrow', `Quick QR Borrow approved for "${book.title}". Due date is ${record.dueDate.toLocaleDateString()}.`);

  res.status(201).json({
    success: true,
    message: `Successfully borrowed "${book.title}" via QR scan!`,
    record,
  });
});

export const qrReturn = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookId } = req.body;
  const userId = req.user?.id;

  const record = await BorrowRecord.findOne({
    book: bookId,
    user: userId,
    status: { $in: ['borrowed', 'overdue'] },
  });

  if (!record) return next(new AppError('No active borrow record found for this book.', 404));

  const book = await Book.findById(bookId);
  if (!book) return next(new AppError('Book not found', 404));

  record.status = 'returned';
  record.returnDate = new Date();
  await record.save();

  book.copiesAvailable += 1;
  await book.save();

  await Notification.create({
    user: userId,
    message: `Book "${book.title}" returned via QR scan.`,
    type: 'borrow',
  });

  emitNotification(userId, 'borrow', `Book "${book.title}" returned via QR scan.`);

  res.status(200).json({
    success: true,
    message: `Successfully returned "${book.title}" via QR scan!`,
    record,
  });
});

export const updateProgress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { recordId } = req.params;
  const { progressPercent } = req.body;
  const userId = req.user?.id;

  if (progressPercent === undefined || progressPercent < 0 || progressPercent > 100) {
    return next(new AppError('Invalid progress percentage value.', 400));
  }

  const record = await BorrowRecord.findById(recordId);
  if (!record) return next(new AppError('Borrow record not found.', 404));

  if (record.user.toString() !== userId) {
    return next(new AppError('You are not authorized to update this record.', 403));
  }

  record.progressPercent = progressPercent;
  await record.save();

  await updateReadingStreak(userId);

  res.status(200).json({
    success: true,
    message: 'Reading progress updated successfully',
    record,
  });
});

export const updateNotes = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { recordId } = req.params;
  const { notes } = req.body;
  const userId = req.user?.id;

  const record = await BorrowRecord.findById(recordId);
  if (!record) return next(new AppError('Borrow record not found.', 404));

  if (record.user.toString() !== userId) {
    return next(new AppError('You are not authorized to update this record.', 403));
  }

  record.notes = notes || '';
  await record.save();

  await updateReadingStreak(userId);

  res.status(200).json({
    success: true,
    message: 'Notes saved successfully',
    record,
  });
});

export const addBookmark = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { recordId } = req.params;
  const { page, note } = req.body;
  const userId = req.user?.id;

  if (!page || page <= 0) {
    return next(new AppError('Invalid page number.', 400));
  }

  const record = await BorrowRecord.findById(recordId);
  if (!record) return next(new AppError('Borrow record not found.', 404));

  if (record.user.toString() !== userId) {
    return next(new AppError('You are not authorized to update this record.', 403));
  }

  record.bookmarks.push({
    page,
    note: note || '',
    createdAt: new Date(),
  });

  await record.save();
  await updateReadingStreak(userId);

  res.status(201).json({
    success: true,
    message: 'Bookmark added successfully',
    record,
  });
});

export const deleteBookmark = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { recordId, bookmarkId } = req.params;
  const userId = req.user?.id;

  const record = await BorrowRecord.findById(recordId);
  if (!record) return next(new AppError('Borrow record not found.', 404));

  if (record.user.toString() !== userId) {
    return next(new AppError('You are not authorized to update this record.', 403));
  }

  record.bookmarks = record.bookmarks.filter((b: any) => b._id.toString() !== bookmarkId);
  await record.save();

  res.status(200).json({
    success: true,
    message: 'Bookmark deleted successfully',
    record,
  });
});
