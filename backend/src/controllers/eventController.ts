import { Response, NextFunction } from 'express';
import { LibraryEvent } from '../models/LibraryEvent';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';

// @desc    Get all upcoming/past events
// @route   GET /api/events
// @access  Private
export const getAllEvents = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const events = await LibraryEvent.find({}).sort({ date: 1 });

  res.status(200).json({
    success: true,
    count: events.length,
    events
  });
});

// @desc    Register student for an event
// @route   POST /api/events/register/:eventId
// @access  Private (Student)
export const registerForEvent = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { eventId } = req.params;
  const userId = req.user?.id;

  const event = await LibraryEvent.findById(eventId);
  if (!event) {
    return next(new AppError('Library event not found', 404));
  }

  // Check if already registered
  const isRegistered = event.attendees.includes(userId as any);
  if (isRegistered) {
    return next(new AppError('You have already registered for this event', 400));
  }

  // Check capacity limits
  if (event.capacity && event.attendees.length >= event.capacity) {
    return next(new AppError('Registration full. Capacity limit reached.', 400));
  }

  event.attendees.push(userId as any);
  await event.save();

  res.status(200).json({
    success: true,
    message: 'Registered for library event successfully!',
    event
  });
});

// @desc    Download event completion certificate (simulate)
// @route   GET /api/events/certificate/:eventId
// @access  Private (Student)
export const downloadEventCertificate = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { eventId } = req.params;
  const userId = req.user?.id;

  const event = await LibraryEvent.findById(eventId);
  if (!event) {
    return next(new AppError('Library event not found', 404));
  }

  const isRegistered = event.attendees.includes(userId as any);
  if (!isRegistered) {
    return next(new AppError('You did not attend this event', 400));
  }

  // Verify event date is past
  if (new Date(event.date) > new Date()) {
    return next(new AppError('Cannot generate completion certificate for future event', 400));
  }

  res.status(200).json({
    success: true,
    certificateId: `ALPHA-CERT-${event._id.toString().substring(18)}-${userId.toString().substring(18)}`,
    title: event.title,
    date: event.date,
    speaker: event.speaker
  });
});

// @desc    Create a new library event
// @route   POST /api/events
// @access  Private (Admin, Librarian)
export const createEvent = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { title, description, speaker, date, location, capacity, tags } = req.body;

  if (!title || !description || !speaker || !date || !location) {
    return next(new AppError('Please provide title, description, speaker, date, and location', 400));
  }

  const event = await LibraryEvent.create({
    title,
    description,
    speaker,
    date: new Date(date),
    location,
    type: req.body.type || 'Workshop',
    capacity: capacity ? parseInt(capacity) : undefined,
    tags: tags || [],
    attendees: []
  });

  res.status(201).json({
    success: true,
    message: 'Library event created successfully',
    event
  });
});
