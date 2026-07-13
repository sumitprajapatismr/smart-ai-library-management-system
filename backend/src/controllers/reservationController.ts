import { Response, NextFunction } from 'express';
import { Reservation } from '../models/Reservation';
import { Book } from '../models/Book';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';
import { sendEmail } from '../config/mail';
import { emitNotification } from '../config/socket';

// @desc    Student reserves a book (when copies are unavailable)
// @route   POST /api/reservations/reserve/:bookId
// @access  Private (Student)
export const reserveBook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookId } = req.params;
  const userId = req.user?.id;

  const book = await Book.findById(bookId);
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  // Check if student has already reserved or borrowed this book
  const activeReservation = await Reservation.findOne({
    book: bookId,
    user: userId,
    status: { $in: ['pending', 'approved'] },
  });

  if (activeReservation) {
    return next(new AppError('You already have an active reservation for this book.', 400));
  }

  const reservation = await Reservation.create({
    book: bookId,
    user: userId,
    status: 'pending',
  });

  // Notify student
  await Notification.create({
    user: userId,
    message: `You successfully reserved "${book.title}". You will be notified when a copy is set aside for you.`,
    type: 'reservation',
  });

  emitNotification(userId, 'reserve_success', `You successfully reserved "${book.title}". You will be notified when a copy is set aside for you.`);

  res.status(201).json({
    success: true,
    message: 'Book reserved successfully',
    reservation,
  });
});

// @desc    Librarian approves a reservation (assigns a returned copy)
// @route   PUT /api/reservations/approve/:reservationId
// @access  Private (Admin, Librarian)
export const approveReservation = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { reservationId } = req.params;

  const reservation = await Reservation.findById(reservationId).populate('book').populate('user');
  if (!reservation) {
    return next(new AppError('Reservation not found', 404));
  }

  if (reservation.status !== 'pending') {
    return next(new AppError('Only pending reservations can be approved', 400));
  }

  const book = await Book.findById(reservation.book._id);
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  if (book.copiesAvailable === 0) {
    return next(new AppError('No copies available to fulfill this reservation', 400));
  }

  // Hold the copy for this student (decrement available copies)
  book.copiesAvailable -= 1;
  // If copiesAvailable becomes 0, change book status to reserved
  if (book.copiesAvailable === 0) {
    book.status = 'reserved';
  }
  await book.save();

  // Approve reservation and set 3 days claim window
  reservation.status = 'approved';
  reservation.expiryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days expiry
  await reservation.save();

  const user = reservation.user as any;

  // Notify student
  await Notification.create({
    user: user._id,
    message: `Your reservation for "${book.title}" was approved! Claim it before ${reservation.expiryDate.toLocaleDateString()}.`,
    type: 'reservation',
  });

  emitNotification(user._id, 'reserve_approved', `Your reservation for "${book.title}" was approved! Claim it before ${reservation.expiryDate.toLocaleDateString()}.`);

  // Send approval email
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #10b981; text-align: center;">Reservation Approved!</h2>
      <p>Hi ${user.name},</p>
      <p>A copy of the book <strong>${book.title}</strong> has been set aside for you.</p>
      <p style="font-size: 16px; color: #10b981;"><strong>Claim Deadline:</strong> ${reservation.expiryDate.toLocaleDateString()}</p>
      <p>Please visit the library desk within 3 days to claim your book. After this, your reservation will expire.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin-top: 30px;" />
      <p style="font-size: 12px; color: #888888; text-align: center;">Smart Library System. All rights reserved.</p>
    </div>
  `;
  await sendEmail(user.email, 'Reservation Approved - Smart Library', emailHtml);

  res.status(200).json({
    success: true,
    message: 'Reservation approved. A copy is locked for the student.',
    reservation,
  });
});

// @desc    Cancel a reservation
// @route   PUT /api/reservations/cancel/:reservationId
// @access  Private (Student, Librarian, Admin)
export const cancelReservation = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { reservationId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const reservation = await Reservation.findById(reservationId).populate('book');
  if (!reservation) {
    return next(new AppError('Reservation not found', 404));
  }

  // Allow student to cancel only their own reservation; librarians/admins can cancel any
  if (userRole === 'student' && reservation.user.toString() !== userId) {
    return next(new AppError('You are not authorized to cancel this reservation', 403));
  }

  if (reservation.status === 'cancelled' || reservation.status === 'expired') {
    return next(new AppError('Reservation is already cancelled or expired', 400));
  }

  // If approved, release the locked copy back to the library
  if (reservation.status === 'approved') {
    const book = await Book.findById(reservation.book._id);
    if (book) {
      book.copiesAvailable += 1;
      if (book.status === 'reserved' && book.copiesAvailable > 0) {
        book.status = 'available';
      }
      await book.save();
    }
  }

  reservation.status = 'cancelled';
  await reservation.save();

  // Notify student
  await Notification.create({
    user: reservation.user as any,
    message: `Reservation for "${(reservation.book as any).title}" has been cancelled.`,
    type: 'reservation',
  });

  res.status(200).json({
    success: true,
    message: 'Reservation cancelled successfully',
    reservation,
  });
});

// @desc    Get current student's reservations
// @route   GET /api/reservations/my-reservations
// @access  Private (Student)
export const getMyReservations = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  const reservations = await Reservation.find({ user: userId })
    .populate('book')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: reservations.length,
    reservations,
  });
});

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private (Admin, Librarian)
export const getAllReservations = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const reservations = await Reservation.find({})
    .populate('book')
    .populate('user')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Reservation.countDocuments({});

  res.status(200).json({
    success: true,
    count: reservations.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    reservations,
  });
});
