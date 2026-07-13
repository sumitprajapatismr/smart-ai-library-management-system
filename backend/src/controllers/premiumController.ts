import { Request, Response, NextFunction } from 'express';
import { StudyRoomReservation } from '../models/StudyRoomReservation';
import { ReadingChallenge } from '../models/ReadingChallenge';
import { Book } from '../models/Book';
import { Category } from '../models/Category';
import { User } from '../models/User';
import { BorrowRecord } from '../models/BorrowRecord';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';
import { genAI } from '../config/gemini';

// @desc    Reserve a study room slot
// @route   POST /api/premium/rooms/reserve
// @access  Private (Student)
export const reserveStudyRoom = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { roomName, date, slot } = req.body;
  const userId = req.user?.id;

  if (!roomName || !date || !slot) {
    return next(new AppError('Room name, date, and slot are required', 400));
  }

  const parsedDate = new Date(date);
  parsedDate.setHours(0, 0, 0, 0);

  // Check if slot is already reserved and approved
  const conflict = await StudyRoomReservation.findOne({
    roomName,
    date: { $gte: parsedDate, $lt: new Date(parsedDate.getTime() + 24 * 60 * 60 * 1000) },
    slot,
    status: 'approved'
  });

  if (conflict) {
    return next(new AppError('This study room slot is already reserved', 400));
  }

  const reservation = await StudyRoomReservation.create({
    user: userId,
    roomName,
    date: parsedDate,
    slot,
    status: 'approved' // Automatically approve study room requests
  });

  res.status(201).json({
    success: true,
    message: 'Study room slot reserved successfully',
    reservation
  });
});

// @desc    Get student room bookings
// @route   GET /api/premium/rooms/my-reservations
// @access  Private (Student)
export const getMyReservations = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const reservations = await StudyRoomReservation.find({ user: userId }).sort({ date: -1 });

  res.status(200).json({
    success: true,
    reservations
  });
});

// @desc    Get live occupied rooms count
// @route   GET /api/premium/rooms/active
// @access  Private
export const getActiveReservations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const reservations = await StudyRoomReservation.find({
    date: { $gte: today },
    status: 'approved'
  }).populate('user', 'name email');

  res.status(200).json({
    success: true,
    reservations
  });
});

// @desc    Start 30-Day Reading Challenge
// @route   POST /api/premium/challenge/start
// @access  Private (Student)
export const startChallenge = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  const activeChallenge = await ReadingChallenge.findOne({ user: userId, status: 'active' });
  if (activeChallenge) {
    return next(new AppError('You already have an active reading challenge in progress', 400));
  }

  const challenge = await ReadingChallenge.create({
    user: userId,
    startDate: new Date(),
    completedDays: 0,
    pagesRead: 0,
    status: 'active'
  });

  res.status(201).json({
    success: true,
    message: '30-Day Reading Challenge started! Good luck!',
    challenge
  });
});

// @desc    Log challenge page logs
// @route   POST /api/premium/challenge/progress
// @access  Private (Student)
export const logChallengeProgress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { pages } = req.body;

  if (!pages || pages <= 0) {
    return next(new AppError('Pages count must be positive', 400));
  }

  const challenge = await ReadingChallenge.findOne({ user: userId, status: 'active' });
  if (!challenge) {
    return next(new AppError('No active reading challenge found. Start one first!', 400));
  }

  challenge.pagesRead += parseInt(pages);
  challenge.completedDays = Math.min(30, challenge.completedDays + 1);

  if (challenge.completedDays >= 30) {
    challenge.status = 'completed';
    challenge.badgeAwarded = 'Challenger Pro';

    // Award badge to user profile
    const user = await User.findById(userId);
    if (user && !user.badges.includes('Challenger Pro')) {
      user.badges.push('Challenger Pro');
      await user.save();
    }
  }

  await challenge.save();

  res.status(200).json({
    success: true,
    message: 'Challenge progress updated successfully',
    challenge
  });
});

// @desc    Get challenge leaderboard standings
// @route   GET /api/premium/challenge/leaderboard
// @access  Public
export const getChallengeLeaderboard = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const leaderboard = await ReadingChallenge.find({ status: { $in: ['active', 'completed'] } })
    .populate('user', 'name email readingStreak')
    .sort({ pagesRead: -1 })
    .limit(10);

  res.status(200).json({
    success: true,
    leaderboard
  });
});

// @desc    AI Book Recommendation based on Mood
// @route   POST /api/premium/mood-recommend
// @access  Private
export const moodRecommendations = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { mood } = req.body;
  if (!mood) {
    return next(new AppError('Mood is required', 400));
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are the AI Reading Mood Guide at a library.
      The student says they are currently in a "${mood}" mood.
      Recommend 3 famous book titles (and authors) that perfectly suit this mood.
      Provide a brief 1-sentence reason for each suggestion.
      
      Respond strictly in JSON matching this schema:
      [
        { "title": "Book Title", "author": "Author Name", "reason": "Reason why it fits" }
      ]
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const recommendations = JSON.parse(response.response.text());
    res.status(200).json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Mood Recommendations Error:', error);
    // Offline/Fallback
    let fallback = [];
    if (mood === 'Happy') {
      fallback = [
        { title: 'The House in the Cerulean Sea', author: 'TJ Klune', reason: 'A wonderfully warm and comforting tale about family and acceptance.' },
        { title: 'A Man Called Ove', author: 'Fredrik Backman', reason: 'A lighthearted yet deeply moving story about hope and community.' }
      ];
    } else if (mood === 'Exam Mode') {
      fallback = [
        { title: 'Clean Code', author: 'Robert C. Martin', reason: 'Essential principles to keep your software clean, structured, and exam-ready.' },
        { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', reason: 'A rigorous guide to mastering algorithms for interviews and exams.' }
      ];
    } else {
      fallback = [
        { title: 'Atomic Habits', author: 'James Clear', reason: 'A highly focused manual on daily habit formations and personal consistency.' },
        { title: 'Deep Work', author: 'Cal Newport', reason: 'Mastering cognitive control and focus in a distracted academic world.' }
      ];
    }
    res.status(200).json({
      success: true,
      recommendations: fallback,
      fallbackUsed: true
    });
  }
});

// @desc    Get Node Link Knowledge Graph of books
// @route   GET /api/premium/knowledge-graph
// @access  Public
export const getKnowledgeGraph = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const books = await Book.find({}).populate('authors').populate('categories').limit(15);
  
  const nodes: any[] = [];
  const links: any[] = [];
  const addedNodes = new Set<string>();

  books.forEach((b: any) => {
    const bookIdStr = b._id.toString();
    if (!addedNodes.has(bookIdStr)) {
      nodes.push({ id: bookIdStr, label: b.title, group: 'book' });
      addedNodes.add(bookIdStr);
    }

    b.authors.forEach((a: any) => {
      const authorIdStr = a._id.toString();
      if (!addedNodes.has(authorIdStr)) {
        nodes.push({ id: authorIdStr, label: a.name, group: 'author' });
        addedNodes.add(authorIdStr);
      }
      links.push({ source: bookIdStr, target: authorIdStr, type: 'written_by' });
    });

    b.categories.forEach((c: any) => {
      const catIdStr = c._id.toString();
      if (!addedNodes.has(catIdStr)) {
        nodes.push({ id: catIdStr, label: c.name, group: 'category' });
        addedNodes.add(catIdStr);
      }
      links.push({ source: bookIdStr, target: catIdStr, type: 'categorized_in' });
    });
  });

  res.status(200).json({
    success: true,
    nodes,
    links
  });
});

// @desc    Get borrowing density Heatmap grid
// @route   GET /api/premium/heatmap
// @access  Public
export const getHeatmapStats = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const records = await BorrowRecord.find({}).select('createdAt');
  
  // 7 days, 24 hours grid
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  
  records.forEach((r: any) => {
    const date = new Date(r.createdAt);
    const day = date.getDay(); // 0 (Sun) - 6 (Sat)
    const hour = date.getHours(); // 0 - 23
    grid[day][hour]++;
  });

  res.status(200).json({
    success: true,
    heatmap: grid
  });
});
