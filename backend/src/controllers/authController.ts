import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';
import { generateToken } from '../utils/token';
import { sendEmail } from '../config/mail';

// Validation Schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Please enter a valid email address').optional(),
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { name, email, password } = result.data;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('User already exists with this email', 400));
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // If first user, make them Admin; else Student
  const count = await User.countDocuments({});
  const role = count === 0 ? 'admin' : 'student';

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    verificationToken,
    isVerified: count === 0, // Auto-verify the first user (Admin)
  });

  if (role !== 'admin') {
    // Send Verification Email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Welcome to Smart Library!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering. Please verify your email by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin-top: 30px;" />
        <p style="font-size: 12px; color: #888888; text-align: center;">Smart Library System. All rights reserved.</p>
      </div>
    `;
    await sendEmail(email, 'Verify Your Email Address', emailHtml);
  }

  res.status(201).json({
    success: true,
    message: role === 'admin' ? 'Admin registered and verified successfully' : 'Registration successful. Please check your email to verify your account.',
    token: generateToken(user._id.toString()),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { email, password } = result.data;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.password) {
    return next(new AppError('Invalid email or password', 401));
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password', 401));
  }

  res.status(200).json({
    success: true,
    token: generateToken(user._id.toString()),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// @desc    Verify Email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { token } = req.params;

  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    return next(new AppError('Invalid or expired verification token', 400));
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now log in.',
  });
});

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = forgotPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { email } = result.data;

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // Generate Reset Token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  await user.save();

  // Send Reset Email
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset. Please click the button below to set a new password. This link is valid for 10 minutes:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin-top: 30px;" />
      <p style="font-size: 12px; color: #888888; text-align: center;">Smart Library System. All rights reserved.</p>
    </div>
  `;

  try {
    await sendEmail(email, 'Password Reset Request', emailHtml);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return next(new AppError('Email could not be sent', 500));
  }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { token } = req.params;
  const result = resetPasswordSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { password } = result.data;

  // Hash reset token
  const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: new Date() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired password reset token', 400));
  }

  // Set new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

// @desc    Get Current User Profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findById(req.user?.id).populate('wishlist');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// @desc    Update Profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = profileUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const user = await User.findById(req.user?.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (result.data.name) user.name = result.data.name;
  
  if (result.data.email && result.data.email !== user.email) {
    const emailExists = await User.findOne({ email: result.data.email });
    if (emailExists) {
      return next(new AppError('Email is already taken', 400));
    }
    user.email = result.data.email;
    user.isVerified = false; // Re-verify email if changed
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4f46e5; text-align: center;">Verify Your New Email Address</h2>
        <p>Hi ${user.name},</p>
        <p>You updated your email. Please verify by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin-top: 30px;" />
        <p style="font-size: 12px; color: #888888; text-align: center;">Smart Library System. All rights reserved.</p>
      </div>
    `;
    await sendEmail(user.email, 'Verify Your Email Address', emailHtml);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// @desc    Toggle Book Wishlist
// @route   POST /api/auth/wishlist/:bookId
// @access  Private (Student)
export const toggleWishlist = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookId } = req.params;
  const user = await User.findById(req.user?.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const bookIdObj = req.params.bookId as any;

  const index = user.wishlist.indexOf(bookIdObj);
  let message = '';
  if (index > -1) {
    user.wishlist.splice(index, 1);
    message = 'Book removed from wishlist';
  } else {
    user.wishlist.push(bookIdObj);
    message = 'Book added to wishlist';
  }

  await user.save();

  res.status(200).json({
    success: true,
    message,
    wishlist: user.wishlist,
  });
});

// ==================== ADMIN OPERATIONS ====================

// @desc    Get All Users
// @route   GET /api/auth/users
// @access  Private (Admin)
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string || '';
  const role = req.query.role as string || '';

  const query: any = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) {
    query.role = role;
  }

  const skip = (page - 1) * limit;

  const users = await User.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    users,
  });
});

// @desc    Update User Role
// @route   PUT /api/auth/users/:id/role
// @access  Private (Admin)
export const updateUserRole = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { role } = req.body;
  
  if (!role || !['admin', 'librarian', 'student'].includes(role)) {
    return next(new AppError('Please provide a valid user role', 400));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Prevent admin from changing their own role
  if (user._id.toString() === req.user?.id.toString()) {
    return next(new AppError('You cannot change your own role', 400));
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User role updated to ${role} successfully`,
    user,
  });
});

// @desc    Delete User
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin)
export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user._id.toString() === req.user?.id.toString()) {
    return next(new AppError('You cannot delete your own admin account', 400));
  }

  await User.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});
