import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { genAI } from '../config/gemini';
import { Book } from '../models/Book';
import { Category } from '../models/Category';
import { BorrowRecord } from '../models/BorrowRecord';
import { User } from '../models/User';
import { Fine } from '../models/Fine';
import { Reservation } from '../models/Reservation';
import { AuthRequest } from '../middlewares/auth';
import { AppError } from '../middlewares/error';
import { asyncHandler } from '../utils/asyncHandler';

// Helper: safe JSON parser to strip Gemini markdown code-block tags if any
const safeParseJSON = (text: string): any => {
  let cleanText = text.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
  }
  return JSON.parse(cleanText.trim());
};

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })).optional(),
});

const smartSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
});

// @desc    AI Chatbot interaction
// @route   POST /api/ai/chat
// @access  Private
export const aiChat = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { message, chatHistory } = result.data;
  const userId = req.user?.id;

  try {
    const user = await User.findById(userId);
    const userActiveLoans = await BorrowRecord.find({ user: userId, status: { $in: ['borrowed', 'overdue'] } }).populate('book');
    const userActiveReservations = await Reservation.find({ user: userId, status: 'pending' }).populate('book');
    const userUnpaidFines = await Fine.find({ user: userId, status: 'unpaid' });
    
    // Overall Library Stats Context
    const totalCatalogBooks = await Book.countDocuments();
    const availableBooksInShelves = await Book.countDocuments({ status: 'available' });
    
    // Latest/Popular Context
    const latestBooks = await Book.find({}).sort({ createdAt: -1 }).limit(3).select('title');
    const trendingBooks = await Book.find({}).sort({ borrowFrequency: -1 }).limit(3).select('title');

    const studentContext = `
      Current Logged-in Student: ${user?.name || 'Student'}
      - Active Loans: ${userActiveLoans.map((b: any) => `"${b.book?.title}" (Due: ${new Date(b.dueDate).toLocaleDateString()})`).join(', ') || 'None'}
      - Unpaid Fines Total: $${userUnpaidFines.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
      - Pending Reservations: ${userActiveReservations.map((r: any) => `"${r.book?.title}" (Status: ${r.status})`).join(', ') || 'None'}
      
      Library Catalog Statistics:
      - Total Book Catalog: ${totalCatalogBooks}
      - Books Available for Borrowing: ${availableBooksInShelves}
      - Latest Added Books: ${latestBooks.map(b => b.title).join(', ')}
      - Trending Books: ${trendingBooks.map(b => b.title).join(', ')}
    `;

    // Inject system instructions into the conversation
    const systemInstruction = `
      You are "ALPHA Pro", the smart, helpful Enterprise AI Digital Librarian.
      
      Library Details & Policies:
      - Timings: Monday to Saturday, 8:00 AM - 8:00 PM. Closed on Sundays and Public Holidays.
      - Membership: Free for all registered college students and faculty staff.
      - Borrow duration: 14 days standard loan.
      - Fine rate: $2.00 per day after the due date.
      - Reservations: Hold duration is 3 days max after approval, after which it expires.
      - Accounts must have 0 outstanding unpaid fines to borrow new catalog entries.
      - Study Rooms: Rooms A, B, and C can be booked by students in 2-hour slots.
      
      Live Database Context:
      ${studentContext}
      
      Your role:
      - Serve as the smart digital librarian. Answer questions on catalog search, timing schedules, rule regulations, and active bookings.
      - AI Career Mentor: Suggest roadmaps for roles like Java Developer, MERN Developer, AI Engineer, Data Scientist, Cyber Security Engineer (breaking them down into roadmaps, books, MCQs, and interview questions).
      - AI Semester Assistant: Recommends study schedules, project plans, and textbook lists for specific courses (e.g. "I am in 4th Semester CSE").
      - AI Study Planner: Create customized daily, weekly, and monthly study grids, including Exam mode and Placement mode prep.
      - Explain topics (e.g. HashMap) at "Beginner", "Intermediate", or "Advanced" levels if requested by the student.
      
      Formatting Rules:
      - Always respond in clear, well-structured Markdown.
      - Use headers, bullet points, bold highlighting, and code block formatting where appropriate.
      - Keep answers highly professional, comprehensive, and friendly.
    `;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction
    });

    // Start a chat session
    const chat = model.startChat({
      history: chatHistory ? chatHistory.map(h => ({
        role: h.role,
        parts: h.parts,
      })) : [],
    });

    const response = await chat.sendMessage(message);
    const text = response.response.text();

    res.status(200).json({
      success: true,
      reply: text,
    });
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    
    // Fetch variables again inside catch block safely
    const user = await User.findById(userId);
    const userActiveLoans = await BorrowRecord.find({ user: userId, status: { $in: ['borrowed', 'overdue'] } }).populate('book');
    const userActiveReservations = await Reservation.find({ user: userId, status: 'pending' }).populate('book');
    const userUnpaidFines = await Fine.find({ user: userId, status: 'unpaid' });

    const fallbackReply = `
### ALPHA Pro Offline Mode

Hello! I am currently operating in **Offline Backup Mode** due to API connection limits. 

Here is some basic context about your account:
- **Student Name**: ${user?.name || 'Student'}
- **Active Borrowed Volumes**: ${userActiveLoans.length} active loans
- **Unpaid Fines**: $${userUnpaidFines.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
- **Pending Reservations**: ${userActiveReservations.length} items on hold

**Library Timing & Policies:**
- Timings: Monday to Saturday, 8:00 AM - 8:00 PM. Closed on Sundays.
- Standard loan period is 14 days. Late fee is $2.00/day.

*Please check back in a few moments once standard network operations resume!*
    `;

    res.status(200).json({
      success: true,
      reply: fallbackReply.trim(),
      fallbackUsed: true
    });
  }
});

// @desc    AI Smart Search (Natural Language Search)
// @route   POST /api/ai/search
// @access  Public
export const aiSmartSearch = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const result = smartSearchSchema.safeParse(req.body);
  if (!result.success) {
    return next(new AppError('Validation Error', 400, result.error.format()));
  }

  const { query } = result.data;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Get list of existing categories to help Gemini map them
    const dbCategories = await Category.find({}).select('name');
    const categoryList = dbCategories.map(c => c.name).join(', ');

    const prompt = `
      You are the search intent analyzer for a smart library system. 
      Analyze the user's natural language search query: "${query}"
      
      Extract search filters. Map them to:
      1. keywords (an array of search terms/words for title/description search)
      2. category (select ONE matching category name from this list if applicable: [${categoryList}], otherwise return null)
      3. author (extract name of author if mentioned, otherwise return null)
      
      Respond strictly in JSON format matching this schema:
      {
        "keywords": ["term1", "term2"],
        "category": "category name or null",
        "author": "author name or null"
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const parsedIntent = safeParseJSON(response.response.text());

    // Build DB Search Query based on AI analysis
    const dbQuery: any = {};
    const searchConditions: any[] = [];

    // Title / Description keyword matches
    if (parsedIntent.keywords && parsedIntent.keywords.length > 0) {
      parsedIntent.keywords.forEach((keyword: string) => {
        searchConditions.push({ title: { $regex: keyword, $options: 'i' } });
        searchConditions.push({ description: { $regex: keyword, $options: 'i' } });
      });
    }

    // Category mapping
    if (parsedIntent.category) {
      const matchCat = await Category.findOne({ name: { $regex: new RegExp(`^${parsedIntent.category}$`, 'i') } });
      if (matchCat) {
        dbQuery.categories = matchCat._id;
      }
    }

    // Author mapping
    if (parsedIntent.author) {
      // Find author ID by author name regex
      const matchingAuthors = await Book.find().populate({
        path: 'authors',
        match: { name: { $regex: parsedIntent.author, $options: 'i' } }
      });
      
      // Collect valid author IDs
      const authorIds: any[] = [];
      matchingAuthors.forEach(b => {
        b.authors.forEach((a: any) => {
          if (a && a._id) authorIds.push(a._id);
        });
      });

      if (authorIds.length > 0) {
        dbQuery.authors = { $in: authorIds };
      }
    }

    // Combine conditions
    if (searchConditions.length > 0) {
      dbQuery.$or = searchConditions;
    }

    // Perform database lookup
    const books = await Book.find(dbQuery)
      .populate('authors')
      .populate('categories')
      .limit(20);

    res.status(200).json({
      success: true,
      queryAnalysis: parsedIntent,
      count: books.length,
      books,
    });
  } catch (error) {
    console.error('AI Smart Search Error:', error);
    // Fallback: Perform basic text search
    const fallbackBooks = await Book.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
      .populate('authors')
      .populate('categories')
      .limit(20);

    res.status(200).json({
      success: true,
      fallbackUsed: true,
      books: fallbackBooks,
    });
  }
});

// @desc    Get AI Book Recommendations based on student history
// @route   GET /api/ai/recommendations
// @access  Private (Student)
export const getAiRecommendations = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  try {
    // 1. Fetch user's borrow history and wishlist
    const borrowHistory = await BorrowRecord.find({ user: userId }).populate('book').limit(10);
    const userWithWishlist = await User.findById(userId).populate('wishlist');

    const historyTitles = borrowHistory.map(b => (b.book as any)?.title).filter(Boolean);
    const wishlistTitles = userWithWishlist?.wishlist.map((b: any) => b?.title).filter(Boolean) || [];

    if (historyTitles.length === 0 && wishlistTitles.length === 0) {
      // Return 3 popular books if no history
      const defaultBooks = await Book.find({}).sort({ rating: -1 }).limit(4).populate('authors');
      return res.status(200).json({
        success: true,
        isGeneric: true,
        recommendations: defaultBooks.map(b => ({
          book: b,
          reason: 'Recommended based on high student ratings.',
        })),
      });
    }

    // 2. Fetch all books titles/categories available to feed Gemini
    const availableBooks = await Book.find({}).select('title description categories').populate('categories').limit(50);
    const booksContext = availableBooks.map(b => ({
      id: b._id,
      title: b.title,
      categories: b.categories.map((c: any) => c.name),
    }));

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are a personalized recommendation system for a library.
      The student has read/borrowed the following books: [${historyTitles.join(', ')}].
      They have added these to their wishlist: [${wishlistTitles.join(', ')}].
      
      Here is the list of available library books with their categories:
      ${JSON.stringify(booksContext)}
      
      Select exactly 3 books from the available list that best match the student's reading preferences.
      Provide a personalized 1-sentence reason for each selection.
      
      You must respond strictly in JSON matching this schema:
      [
        {
          "bookId": "string (the database ID of the book)",
          "reason": "Personalized recommendation text"
        }
      ]
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const recommendationsArray = safeParseJSON(response.response.text());

    // 3. Hydrate DB details for the recommended books
    const populatedRecommendations = [];
    for (const rec of recommendationsArray) {
      const book = await Book.findById(rec.bookId).populate('authors').populate('categories');
      if (book) {
        populatedRecommendations.push({
          book,
          reason: rec.reason,
        });
      }
    }

    res.status(200).json({
      success: true,
      recommendations: populatedRecommendations,
    });
  } catch (error) {
    console.error('Recommendations Error:', error);
    // Fallback: Return top rated books
    const fallbackBooks = await Book.find({}).sort({ rating: -1 }).limit(3).populate('authors');
    res.status(200).json({
      success: true,
      fallbackUsed: true,
      recommendations: fallbackBooks.map(b => ({
        book: b,
        reason: 'Highly rated by the student community.',
      })),
    });
  }
});

export const generateReadingPlan = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookTitle, totalPages, targetDays, targetGoal } = req.body;
  if (!bookTitle || !totalPages || !targetDays) {
    return next(new AppError('Book title, total pages, and target days are required.', 400));
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are an expert reading planner assistant. 
      Generate a daily reading plan for the book "${bookTitle}" containing ${totalPages} pages, to be completed in ${targetDays} days with the goal of "${targetGoal || 'general reading'}".
      
      Respond strictly in JSON format matching this schema:
      {
        "dailyGoal": "X pages per day",
        "schedule": [
          { 
            "day": 1, 
            "task": "Read pages 1 to Y", 
            "duration": "30 mins",
            "chapters": "Read pages 1 to Y",
            "pages": "Pages 1 to Y"
          }
        ]
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const planData = safeParseJSON(response.response.text());
    res.status(200).json({
      success: true,
      plan: planData,
    });
  } catch (error) {
    console.error('AI Reading Planner Error:', error);
    const pagesPerDay = Math.ceil(totalPages / targetDays);
    const schedule = Array.from({ length: targetDays }, (_, idx) => {
      const pageStart = idx * pagesPerDay + 1;
      const pageEnd = Math.min((idx + 1) * pagesPerDay, totalPages);
      return {
        day: idx + 1,
        task: `Read pages ${pageStart} to ${pageEnd}`,
        duration: '35 mins',
        chapters: `Read pages ${pageStart} to ${pageEnd}`,
        pages: `Pages ${pageStart} to ${pageEnd}`
      };
    });

    res.status(200).json({
      success: true,
      plan: {
        dailyGoal: `${pagesPerDay} pages per day`,
        schedule,
      },
      fallbackUsed: true,
    });
  }
});

import { ReadingPlan } from '../models/ReadingPlan';

export const saveReadingPlan = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookTitle, totalPages, targetDays, dailyGoal, schedule } = req.body;
  const userId = req.user?.id;

  const plan = await ReadingPlan.create({
    user: userId,
    bookTitle,
    totalPages,
    targetDays,
    dailyGoal,
    schedule,
    progress: 0,
  });

  res.status(201).json({
    success: true,
    message: 'Reading plan saved successfully',
    plan,
  });
});

export const getReadingPlans = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const plans = await ReadingPlan.find({ user: userId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    plans,
  });
});

export const updateReadingPlanProgress = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { planId } = req.params;
  const { progress } = req.body;
  const userId = req.user?.id;

  const plan = await ReadingPlan.findById(planId);
  if (!plan) return next(new AppError('Reading plan not found.', 404));
  if (plan.user.toString() !== userId) return next(new AppError('Unauthorized access.', 403));

  plan.progress = progress;
  await plan.save();

  res.status(200).json({
    success: true,
    message: 'Plan progress updated',
    plan,
  });
});

export const deleteReadingPlan = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { planId } = req.params;
  const userId = req.user?.id;

  const plan = await ReadingPlan.findById(planId);
  if (!plan) return next(new AppError('Reading plan not found.', 404));
  if (plan.user.toString() !== userId) return next(new AppError('Unauthorized access.', 403));

  await ReadingPlan.findByIdAndDelete(planId);

  res.status(200).json({
    success: true,
    message: 'Reading plan deleted successfully',
  });
});

export const generateQuiz = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { bookTitle, numQuestions } = req.body;
  if (!bookTitle) return next(new AppError('Book title is required.', 400));

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are a library academic quiz generator.
      Generate a multiple choice quiz of ${numQuestions || 4} questions for the book "${bookTitle}".
      For each question, provide 4 options (A, B, C, D) and specify the correct option index (0-3).
      
      Respond strictly in JSON format matching this schema:
      [
        {
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "choices": ["Option A", "Option B", "Option C", "Option D"],
          "answerIndex": 0,
          "correctIndex": 0
        }
      ]
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const quiz = safeParseJSON(response.response.text());
    res.status(200).json({
      success: true,
      quiz,
    });
  } catch (error) {
    console.error('Quiz Generator Error:', error);
    res.status(200).json({
      success: true,
      quiz: [
        {
          question: `What is the primary topic of "${bookTitle}"?`,
          options: ['Core conceptual foundations', 'Historical biography', 'Hardware specifications', 'Fictional poetry'],
          choices: ['Core conceptual foundations', 'Historical biography', 'Hardware specifications', 'Fictional poetry'],
          answerIndex: 0,
          correctIndex: 0,
        },
        {
          question: `Which of the following is most associated with "${bookTitle}"?`,
          options: ['Practical craftsmanship best practices', 'Graphic user interface templates', 'Compilers and parsers', 'None of the above'],
          choices: ['Practical craftsmanship best practices', 'Graphic user interface templates', 'Compilers and parsers', 'None of the above'],
          answerIndex: 0,
          correctIndex: 0,
        }
      ],
      fallbackUsed: true,
    });
  }
});

export const generateFlashcards = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { topic } = req.body;
  if (!topic) return next(new AppError('Topic is required.', 400));

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Generate exactly 5 key study flashcards for the topic or book "${topic}".
      For each flashcard, provide a front side (question or key term) and a back side (detailed explanation or answer).
      
      Respond strictly in JSON format matching this schema:
      [
        {
          "front": "Question or Key Term",
          "back": "Detailed Answer or explanation"
        }
      ]
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const flashcards = safeParseJSON(response.response.text());
    res.status(200).json({
      success: true,
      flashcards,
    });
  } catch (error) {
    console.error('Flashcard Error:', error);
    res.status(200).json({
      success: true,
      flashcards: [
        { front: `Core aspect of ${topic}`, back: `The essential conceptual paradigm details for ${topic}.` },
        { front: `Key takeaway of ${topic}`, back: `Focus on readability, modular design, and robust code architectures.` },
        { front: `Best practices for ${topic}`, back: `Minimize complexity, keep designs clear, and test logic thoroughly.` }
      ],
      fallbackUsed: true,
    });
  }
});

export const explainTopic = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { topic, level } = req.body;
  if (!topic) return next(new AppError('Topic is required.', 400));

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Explain the topic "${topic}" in simple, beginner-friendly terms.
      Adapt your language tone to a "${level || 'novice'}" level.
      Format the explanation cleanly in Markdown with headings and bullet points.
    `;

    const response = await model.generateContent(prompt);
    res.status(200).json({
      success: true,
      explanation: response.response.text(),
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      explanation: `### Explanation of ${topic} (${level || 'novice'})
      
An explanation of **${topic}** is currently in offline mode. 
Generally, **${topic}** represents a core computer science or engineering concept designed to solve specific operational constraints. 
For more information, please check standard reference documentation.`,
    });
  }
});

export const compareBooks = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { book1Title, book2Title } = req.body;
  if (!book1Title || !book2Title) return next(new AppError('Both book titles are required.', 400));

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Compare the books "${book1Title}" and "${book2Title}" side-by-side.
      Analyze their:
      1. Target Audience
      2. Difficulty Level
      3. Key Architectural concepts covered
      4. Pros & Cons of each book.
      
      Respond in clear, beautiful Markdown layout.
    `;

    const response = await model.generateContent(prompt);
    res.status(200).json({
      success: true,
      comparison: response.response.text(),
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      comparison: `### Comparison: ${book1Title} vs ${book2Title}
      
- **${book1Title}**: Focused on foundational conceptual practices, modular structures, and design aesthetics.
- **${book2Title}**: Focused on framework APIs, code deployment practices, and concrete language features.
      
*Offline mode comparison grid.*`,
    });
  }
});

export const getCareerRecommendations = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { careerGoal } = req.body;
  if (!careerGoal) return next(new AppError('Career goal is required.', 400));

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      Recommend reading suggestions and study paths for a student aiming to become a "${careerGoal}".
      List the specific books and technical topics they should focus on.
      Format the recommendations in Markdown.
    `;

    const response = await model.generateContent(prompt);
    res.status(200).json({
      success: true,
      recommendations: response.response.text(),
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      recommendations: `### Study Path for: ${careerGoal}
      
1. **Foundations**: Learn algorithms, data structures, and code architecture principles.
2. **Specialization**: Master language features, concurrency, and library-specific tools.
3. **Recommended Reading**: *Clean Code*, *Effective Java*, and specific documentation guides.`,
    });
  }
});

export const getWeeklyReport = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  try {
    const user = await User.findById(userId);
    const activeBorrows = await BorrowRecord.find({ user: userId, status: { $in: ['borrowed', 'overdue'] } }).populate('book');
    const completedHistory = await BorrowRecord.find({ user: userId, status: 'returned' });

    const booksReadTitles = activeBorrows.map(b => (b.book as any)?.title).join(', ');
    const completedTitles = completedHistory.map(b => (b.book as any)?.title).join(', ');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `
      You are the AI Reading Coach at a university library.
      Create a personalized weekly reading performance report for the student "${user?.name || 'Sumit'}" based on this stats:
      - Current Reading Streak: ${user?.readingStreak || 0} days
      - Current Active Checkouts: [${booksReadTitles}]
      - Previously Read Books: [${completedTitles}]
      
      Respond strictly in JSON matching this schema:
      {
        "score": 85,
        "summary": "Weekly analytical review in Markdown format. Praise their streak or suggest improvements.",
        "nextAction": "Actionable task for today (e.g. Read 15 pages of your book)"
      }
    `;

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const report = safeParseJSON(response.response.text());
    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Weekly Report Error:', error);
    res.status(200).json({
      success: true,
      report: {
        score: 75,
        summary: `### Weekly Reading Analytical Review
        
Keep reading consistently! Try to make time every day to review your borrowed books. Your active loans represent great learning opportunities in programming and design.`,
        nextAction: 'Spend 20 minutes reading your active checkout today.',
      },
    });
  }
});
