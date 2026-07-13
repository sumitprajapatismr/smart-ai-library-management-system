import { Response, NextFunction } from 'express';
import { Notification } from '../models/Notification';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
export const getMyNotifications = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50); // Get latest 50 notifications

  res.status(200).json({
    success: true,
    count: notifications.length,
    notifications,
  });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user?.id,
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    notification,
  });
});

// @desc    Mark all notifications as read for logged in user
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});
