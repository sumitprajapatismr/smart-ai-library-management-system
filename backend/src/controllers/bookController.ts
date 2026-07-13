import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Book } from '../models/Book';
import { Author } from '../models/Author';
import { Category } from '../models/Category';
import { BorrowRecord } from '../models/BorrowRecord';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadToCloudinary } from '../middlewares/upload';
import { genAI } from '../config/gemini';

// Validation Schema
const bookSchema = z.object({
  title: z.string().min(1, 'Book title is required'),
  subtitle: z.string().optional(),
  authors: z.array(z.string()).min(1, 'At least one author is required'),
  categories: z.array(z.string()).min(1, 'At least one category is required'),
  isbn: z.string().min(10, 'ISBN must be at least 10 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  totalCopies: z.coerce.number().int().nonnegative('Total copies must be 0 or more'),
});

// Helper: Call Gemini to generate a summary and key points
const generateAISummary = async (title: string, description: string): Promise<{ summary: string; keyPoints: string[] }> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are a professional literary assistant. Analyze the book title and description provided.
      Generate a short summary (around 60-80 words) and exactly 4 key learning points or takeaways from the book.
      
      Book Title: ${title}
      Description: ${description}
      
      You must respond strictly in JSON format matching this schema:
      {
        "summary": "Concise summary of the book",
        "keyPoints": [
          "Takeaway 1",
          "Takeaway 2",
          "Takeaway 3",
          "Takeaway 4"
        ]
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const resultText = response.response.text();
    const resultJson = JSON.parse(resultText);

    return {
      summary: resultJson.summary || 'Summary not available.',
      keyPoints: resultJson.keyPoints || [],
    };
  } catch (error) {
    console.error('Failed to generate AI book details:', error);
    return {
      summary: description.slice(0, 150) + '...',
      keyPoints: ['Core concepts of the book topic', 'Practical applications', 'Insightful theories', 'Expert perspectives'],
    };
  }
};

// Helper: Resolve author and category names to ObjectIds (create if not exist)
const resolveAuthorsAndCategories = async (
  authorNames: string[],
  categoryNames: string[]
): Promise<{ authorIds: string[]; categoryIds: string[] }> => {
  const authorIds: string[] = [];
  const categoryIds: string[] = [];

  // 1. Resolve Authors
  for (const name of authorNames) {
    const trimmedName = name.trim();
    if (!trimmedName) continue;
    
    let author = null;
    if (Types.ObjectId.isValid(trimmedName) && trimmedName.length === 24) {
      author = await Author.findById(trimmedName);
    }
    
    if (!author) {
      author = await Author.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    }
    
    if (!author) {
      author = await Author.create({
        name: trimmedName,
        biography: `${trimmedName} is an author featured in our library catalog.`,
      });
    }
    authorIds.push(author._id.toString());
  }

  // 2. Resolve Categories
  for (const name of categoryNames) {
    const trimmedName = name.trim();
    if (!trimmedName) continue;

    let category = null;
    if (Types.ObjectId.isValid(trimmedName) && trimmedName.length === 24) {
      category = await Category.findById(trimmedName);
    }
    
    if (!category) {
      category = await Category.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    }
    
    if (!category) {
      category = await Category.create({
        name: trimmedName,
        description: `Academic and professional books categorized under ${trimmedName}.`,
      });
    }
    categoryIds.push(category._id.toString());
  }

  return { authorIds, categoryIds };
};

// @desc    Create a new book (with AI description enrichment)
// @route   POST /api/books
// @access  Private (Admin, Librarian)
export const createBook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let bodyData = { ...req.body };
  if (typeof bodyData.authors === 'string') {
    try { bodyData.authors = JSON.parse(bodyData.authors); } catch (e) { /* use as is */ }
  }
  if (typeof bodyData.categories === 'string') {
    try { bodyData.categories = JSON.parse(bodyData.categories); } catch (e) { /* use as is */ }
  }

  const result = bookSchema.safeParse(bodyData);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { title, subtitle, authors, categories, isbn, description, totalCopies } = result.data;

  // Resolve author names and category names to ObjectIds
  let resolvedAuthors: string[] = [];
  let resolvedCategories: string[] = [];
  try {
    const resolved = await resolveAuthorsAndCategories(authors, categories);
    resolvedAuthors = resolved.authorIds;
    resolvedCategories = resolved.categoryIds;
  } catch (error) {
    return next(new AppError(`Failed to resolve authors or categories: ${error instanceof Error ? error.message : error}`, 400));
  }

  // Check if ISBN already exists
  const bookExists = await Book.findOne({ isbn });
  if (bookExists) {
    return next(new AppError('A book with this ISBN already exists', 400));
  }

  // Handle Multiple File Uploads via Multer upload.fields
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  
  let coverImageUrl = undefined;
  if (files && files['coverImage'] && files['coverImage'][0]) {
    coverImageUrl = await uploadToCloudinary(files['coverImage'][0].buffer, 'book_covers', 'image');
  }

  let pdfUrl = undefined;
  if (files && files['pdfFile'] && files['pdfFile'][0]) {
    pdfUrl = await uploadToCloudinary(files['pdfFile'][0].buffer, 'ebooks', 'raw');
  }

  let audioUrl = undefined;
  if (files && files['audioFile'] && files['audioFile'][0]) {
    audioUrl = await uploadToCloudinary(files['audioFile'][0].buffer, 'audiobooks', 'video');
  }

  const isEbook = bodyData.isEbook === 'true' || bodyData.isEbook === true;
  const isAudiobook = bodyData.isAudiobook === 'true' || bodyData.isAudiobook === true;

  // Generate AI Summary and KeyPoints
  const aiEnrichment = await generateAISummary(title, description);

  const book = await Book.create({
    title,
    subtitle,
    authors: resolvedAuthors,
    categories: resolvedCategories,
    isbn,
    description,
    summary: aiEnrichment.summary,
    keyPoints: aiEnrichment.keyPoints,
    coverImage: coverImageUrl,
    pdfUrl,
    audioUrl,
    isEbook,
    isAudiobook,
    totalCopies,
    copiesAvailable: totalCopies,
    status: totalCopies > 0 ? 'available' : 'unavailable',
    condition: bodyData.condition || 'New',
    difficulty: bodyData.difficulty || 'Easy',
    estimatedReadingTimeMinutes: bodyData.estimatedReadingTimeMinutes ? parseInt(bodyData.estimatedReadingTimeMinutes) : 120,
    requiredKnowledge: typeof bodyData.requiredKnowledge === 'string' ? bodyData.requiredKnowledge.split(',').map((k: string) => k.trim()) : [],
    programmingLevel: bodyData.programmingLevel || 'None',
    mathematicsLevel: bodyData.mathematicsLevel || 'None',
    careerRelevance: bodyData.careerRelevance || '',
    borrowFrequency: 0,
    popularityScore: 0,
  });

  const populatedBook = await Book.findById(book._id)
    .populate('authors')
    .populate('categories');

  res.status(201).json({
    success: true,
    message: 'Book created successfully (AI summary generated)',
    book: populatedBook,
  });
});

// @desc    Get all books (with search, filter, pagination, sorting)
// @route   GET /api/books
// @access  Public
export const getBooks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const search = req.query.search as string || '';
  const category = req.query.category as string || '';
  const author = req.query.author as string || '';
  const status = req.query.status as string || '';
  const sort = req.query.sort as string || 'createdAt';

  const query: any = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { subtitle: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    query.categories = category;
  }

  if (author) {
    query.authors = author;
  }

  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  // Map sort option parameter
  let sortOption: any = { createdAt: -1 };
  if (sort === 'rating') {
    sortOption = { rating: -1 };
  } else if (sort === 'title') {
    sortOption = { title: 1 };
  } else if (sort === 'createdAt') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'popularity') {
    sortOption = { popularityScore: -1 };
  }

  const books = await Book.find(query)
    .populate('authors')
    .populate('categories')
    .skip(skip)
    .limit(limit)
    .sort(sortOption);

  const total = await Book.countDocuments(query);

  res.status(200).json({
    success: true,
    count: books.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
    books,
  });
});

// @desc    Get single book details
// @route   GET /api/books/:id
// @access  Public
export const getBook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const book = await Book.findById(req.params.id)
    .populate('authors')
    .populate('categories');

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  res.status(200).json({
    success: true,
    book,
  });
});

// @desc    Update book details
// @route   PUT /api/books/:id
// @access  Private (Admin, Librarian)
export const updateBook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  let bodyData = { ...req.body };
  if (typeof bodyData.authors === 'string') {
    try { bodyData.authors = JSON.parse(bodyData.authors); } catch (e) { /* use as is */ }
  }
  if (typeof bodyData.categories === 'string') {
    try { bodyData.categories = JSON.parse(bodyData.categories); } catch (e) { /* use as is */ }
  }

  const result = bookSchema.safeParse(bodyData);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const book = await Book.findById(req.params.id);
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  const { title, subtitle, authors, categories, isbn, description, totalCopies } = result.data;

  // Resolve author names and category names to ObjectIds
  let resolvedAuthors: string[] = [];
  let resolvedCategories: string[] = [];
  try {
    const resolved = await resolveAuthorsAndCategories(authors, categories);
    resolvedAuthors = resolved.authorIds;
    resolvedCategories = resolved.categoryIds;
  } catch (error) {
    return next(new AppError(`Failed to resolve authors or categories: ${error instanceof Error ? error.message : error}`, 400));
  }

  // Check if ISBN is taken by another book
  if (isbn !== book.isbn) {
    const bookExists = await Book.findOne({ isbn });
    if (bookExists) {
      return next(new AppError('A book with this ISBN already exists', 400));
    }
  }

  // Handle Cover and PDF/Audio uploads
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  
  let coverImageUrl = book.coverImage;
  if (files && files['coverImage'] && files['coverImage'][0]) {
    coverImageUrl = await uploadToCloudinary(files['coverImage'][0].buffer, 'book_covers', 'image');
  }

  let pdfUrl = book.pdfUrl;
  if (files && files['pdfFile'] && files['pdfFile'][0]) {
    pdfUrl = await uploadToCloudinary(files['pdfFile'][0].buffer, 'ebooks', 'raw');
  }

  let audioUrl = book.audioUrl;
  if (files && files['audioFile'] && files['audioFile'][0]) {
    audioUrl = await uploadToCloudinary(files['audioFile'][0].buffer, 'audiobooks', 'video');
  }

  const isEbook = bodyData.isEbook === 'true' || bodyData.isEbook === true;
  const isAudiobook = bodyData.isAudiobook === 'true' || bodyData.isAudiobook === true;

  // Re-generate AI summary if description changed significantly
  let summary = book.summary;
  let keyPoints = book.keyPoints;
  if (description !== book.description || !summary || summary.length === 0) {
    const aiEnrichment = await generateAISummary(title, description);
    summary = aiEnrichment.summary;
    keyPoints = aiEnrichment.keyPoints;
  }

  // Adjust copiesAvailable based on change in totalCopies
  const difference = totalCopies - book.totalCopies;
  const newCopiesAvailable = book.copiesAvailable + difference;

  if (newCopiesAvailable < 0) {
    return next(new AppError('Cannot reduce total copies below active borrows', 400));
  }

  book.title = title;
  book.subtitle = subtitle;
  book.authors = resolvedAuthors.map(id => id as any);
  book.categories = resolvedCategories.map(id => id as any);
  book.isbn = isbn;
  book.description = description;
  book.summary = summary;
  book.keyPoints = keyPoints;
  book.coverImage = coverImageUrl;
  book.pdfUrl = pdfUrl;
  book.audioUrl = audioUrl;
  book.isEbook = isEbook;
  book.isAudiobook = isAudiobook;
  book.totalCopies = totalCopies;
  book.copiesAvailable = newCopiesAvailable;

  if (bodyData.condition) book.condition = bodyData.condition;
  if (bodyData.difficulty) book.difficulty = bodyData.difficulty;
  if (bodyData.estimatedReadingTimeMinutes) book.estimatedReadingTimeMinutes = parseInt(bodyData.estimatedReadingTimeMinutes);
  if (bodyData.programmingLevel) book.programmingLevel = bodyData.programmingLevel;
  if (bodyData.mathematicsLevel) book.mathematicsLevel = bodyData.mathematicsLevel;
  if (bodyData.careerRelevance) book.careerRelevance = bodyData.careerRelevance;
  if (bodyData.requiredKnowledge) {
    book.requiredKnowledge = typeof bodyData.requiredKnowledge === 'string' ? bodyData.requiredKnowledge.split(',').map((k: string) => k.trim()) : bodyData.requiredKnowledge;
  }

  await book.save();

  const populatedBook = await Book.findById(book._id)
    .populate('authors')
    .populate('categories');

  res.status(200).json({
    success: true,
    message: 'Book updated successfully (AI details refreshed)',
    book: populatedBook,
  });
});

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private (Admin, Librarian)
export const deleteBook = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  if (book.copiesAvailable < book.totalCopies) {
    return next(new AppError('Cannot delete book while copies are borrowed', 400));
  }

  await Book.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Book deleted successfully',
  });
});

// @desc    Get book stats for occupancy and availability calculations
// @route   GET /api/books/stats
// @access  Private
export const getBookStats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const totalTitles = await Book.countDocuments({});
  const totalCopiesResult = await Book.aggregate([
    { $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$copiesAvailable' } } }
  ]);
  
  const totalCopies = totalCopiesResult[0]?.total || 0;
  const availableCopies = totalCopiesResult[0]?.available || 0;
  const borrowedCopies = totalCopies - availableCopies;
  
  const totalCategories = await Category.countDocuments({});
  const totalAuthors = await Author.countDocuments({});

  const damagedCopies = await Book.countDocuments({ condition: 'Damaged' });

  res.status(200).json({
    success: true,
    stats: {
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies,
      totalCategories,
      totalAuthors,
      damagedCopies
    }
  });
});

// @desc    Get recently added books
// @route   GET /api/books/recent
// @access  Public
export const getRecentBooks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const books = await Book.find({})
    .populate('authors')
    .populate('categories')
    .sort({ createdAt: -1 })
    .limit(6);

  res.status(200).json({
    success: true,
    books
  });
});

// @desc    Get trending books (borrowed in last 30 days)
// @route   GET /api/books/trending
// @access  Public
export const getTrendingBooks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trendingAgg = await BorrowRecord.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: '$book', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 6 }
  ]);

  const bookIds = trendingAgg.map(t => t._id);
  let books = [];
  if (bookIds.length > 0) {
    books = await Book.find({ _id: { $in: bookIds } })
      .populate('authors')
      .populate('categories');
  } else {
    // Fallback: top rated books
    books = await Book.find({})
      .populate('authors')
      .populate('categories')
      .sort({ rating: -1 })
      .limit(6);
  }

  res.status(200).json({
    success: true,
    books
  });
});

// @desc    Get popular books
// @route   GET /api/books/popular
// @access  Public
export const getPopularBooks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const books = await Book.find({})
    .populate('authors')
    .populate('categories')
    .sort({ rating: -1, reviewCount: -1 })
    .limit(6);

  res.status(200).json({
    success: true,
    books
  });
});

// @desc    Get recommended books based on user interest categories
// @route   GET /api/books/recommended
// @access  Private
export const getRecommendedBooks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Find user's borrowing history categories
  const userBorrows = await BorrowRecord.find({ user: userId }).populate('book');
  const userCatIds = new Set<string>();
  userBorrows.forEach((b: any) => {
    b.book?.categories?.forEach((c: any) => {
      userCatIds.add(c.toString());
    });
  });

  let books: any[] = [];
  if (userCatIds.size > 0) {
    books = await Book.find({ categories: { $in: Array.from(userCatIds) } })
      .populate('authors')
      .populate('categories')
      .limit(6);
  }

  if (books.length === 0) {
    books = await Book.find({})
      .populate('authors')
      .populate('categories')
      .sort({ rating: -1 })
      .limit(6);
  }

  res.status(200).json({
    success: true,
    books
  });
});
