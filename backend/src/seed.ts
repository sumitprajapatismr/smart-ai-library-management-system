import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from './models/User';
import { Book } from './models/Book';
import { Author } from './models/Author';
import { Category } from './models/Category';
import { BorrowRecord } from './models/BorrowRecord';
import { Reservation } from './models/Reservation';
import { Fine } from './models/Fine';
import { Notification } from './models/Notification';
import { Review } from './models/Review';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-library';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB. Clearing existing collections...');

    // Clear existing collections
    await User.deleteMany({});
    await Book.deleteMany({});
    await Author.deleteMany({});
    await Category.deleteMany({});
    await BorrowRecord.deleteMany({});
    await Reservation.deleteMany({});
    await Fine.deleteMany({});
    await Notification.deleteMany({});
    await Review.deleteMany({});

    console.log('Collections cleared. Hashing user passwords...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Users
    console.log('Seeding Users...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@university.edu',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
    });

    const librarian = await User.create({
      name: 'Librarian Sarah',
      email: 'librarian@university.edu',
      password: hashedPassword,
      role: 'librarian',
      isVerified: true,
    });

    const student = await User.create({
      name: 'Sumit',
      email: 'student@university.edu',
      password: hashedPassword,
      role: 'student',
      isVerified: true,
      wishlist: [],
    });

    // 2. Create Categories
    console.log('Seeding Categories...');
    const catCS = await Category.create({ name: 'Computer Science', description: 'Programming, algorithms, and tech' });
    const catSciFi = await Category.create({ name: 'Science Fiction', description: 'Speculative and futuristic fiction' });
    const catLit = await Category.create({ name: 'Literature', description: 'Classic and modern novels' });
    const catMath = await Category.create({ name: 'Mathematics', description: 'Calculus, algebra, and discrete math' });

    // 3. Create Authors
    console.log('Seeding Authors...');
    const authUncleBob = await Author.create({ name: 'Robert C. Martin', bio: 'Co-author of Agile Manifesto, author of Clean Code' });
    const authJoshua = await Author.create({ name: 'Joshua Bloch', bio: 'Designer of various Java Platform APIs, author of Effective Java' });
    const authKathy = await Author.create({ name: 'Kathy Sierra', bio: 'Creator of Head First series' });
    const authAsimov = await Author.create({ name: 'Isaac Asimov', bio: 'Grand master of science fiction' });
    const authFowler = await Author.create({ name: 'Martin Fowler', bio: 'Author of Refactoring' });

    // 4. Create Books (with AI summaries & takeaways pre-filled for offline/test reliability)
    console.log('Seeding Books with AI insights...');
    const bookCleanCode = await Book.create({
      title: 'Clean Code',
      subtitle: 'A Handbook of Agile Software Craftsmanship',
      authors: [authUncleBob._id],
      categories: [catCS._id],
      isbn: '9780132350884',
      description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. This book is a guide on how to write code that reads like well-written prose.',
      summary: 'Clean Code: A Handbook of Agile Software Craftsmanship focuses on writing software that is easy to read, refactor, and maintain. Uncle Bob covers core agile principles, code smells, object formatting, error handling, and test-driven development (TDD).',
      keyPoints: [
        'Write meaningful names for classes, variables, and methods that reveal intent.',
        'Keep functions small, focused, and performing exactly one distinct task.',
        'Minimize code comments by writing expressive, self-documenting code.',
        'Develop thorough unit tests matching F.I.R.S.T properties (Fast, Independent, Repeatable, Self-Validating, Timely).'
      ],
      totalCopies: 5,
      copiesAvailable: 4,
      rating: 4.8,
      reviewsCount: 1,
      status: 'available'
    });

    const bookEffectiveJava = await Book.create({
      title: 'Effective Java',
      subtitle: 'Third Edition',
      authors: [authJoshua._id],
      categories: [catCS._id],
      isbn: '9780134685991',
      description: 'The definitive guide to Java platform best practices. Since the previous edition of Effective Java, the Java programming language has undergone major changes. This book brings together seventy-eight programmer\'s rules of thumb: working, best-practice solutions for the programming challenges you encounter every day.',
      summary: 'Effective Java guides developers on using modern Java design patterns and language features (streams, lambdas, generics, serialization) effectively. It is a compilation of 90 items detailing patterns that improve code performance and safety.',
      keyPoints: [
        'Prefer static factory methods instead of public constructors to instantiate objects.',
        'Favor composition over inheritance to make designs robust and extendable.',
        'Enforce type safety at compile time using generics, avoiding unchecked cast warnings.',
        'Minimize accessibility of classes and members to hide internal implementation details.'
      ],
      totalCopies: 4,
      copiesAvailable: 3,
      rating: 4.9,
      reviewsCount: 1,
      status: 'available'
    });

    const bookHeadFirstJava = await Book.create({
      title: 'Head First Java',
      subtitle: 'A Brain-Friendly Guide',
      authors: [authKathy._id],
      categories: [catCS._id],
      isbn: '9781492091622',
      description: 'Head First Java is a complete learning experience in Java and object-oriented programming. Designed using cognitive science principles, this guide uses visual learning, puzzles, mock interviews, and exercises to teach object-oriented design.',
      summary: 'Head First Java uses cognitive learning methods, puzzles, and rich visual styling to explain OOP fundamentals, GUI development, Exception handling, Generics, Collections, and Concurrency in Java.',
      keyPoints: [
        'Understand object orientation through concepts of inheritance, polymorphism, and interface implementation.',
        'Master memory allocation between stack (local variables) and heap (instantiated objects).',
        'Learn Java Collections framework structure (Lists, Sets, Maps) and proper generics declaration.',
        'Build desktop windows using Swing GUI layout managers and event listeners.'
      ],
      totalCopies: 3,
      copiesAvailable: 3,
      rating: 4.6,
      reviewsCount: 0,
      status: 'available'
    });

    const bookFoundation = await Book.create({
      title: 'Foundation',
      subtitle: 'The Foundation Trilogy',
      authors: [authAsimov._id],
      categories: [catSciFi._id],
      isbn: '9780553293357',
      description: 'The story of psychohistorian Hari Seldon, who foresees the fall of the Galactic Empire and establishes the Foundation to preserve humanity\'s knowledge and shorten the dark ages.',
      summary: 'Foundation tells the grand narrative of psychohistorian Hari Seldon, who attempts to save galactic civilization from thousands of years of dark ages by establishing a repository of scientific knowledge on a remote planet.',
      keyPoints: [
        'Explore psychohistory, which uses statistical math to predict trends in massive populations.',
        'Examine historical cycles and the inevitability of political structures rising and falling.',
        'Understand the importance of scientific knowledge and technology in preserving culture.',
        'Follow a series of crises Seldon anticipated, showing how individuals adapt to historical forces.'
      ],
      totalCopies: 3,
      copiesAvailable: 2,
      rating: 4.7,
      reviewsCount: 1,
      status: 'available'
    });

    // 5. Link Wishlist for student Sumit
    student.wishlist = [bookHeadFirstJava._id as any];
    await student.save();

    // 6. Create Reviews
    console.log('Seeding Reviews...');
    await Review.create({
      book: bookCleanCode._id,
      user: student._id,
      rating: 5,
      comment: 'Essential book for every software engineer. It changed how I view variables and comments.',
    });

    await Review.create({
      book: bookEffectiveJava._id,
      user: student._id,
      rating: 5,
      comment: 'Masterclass in Java language design. Best Java book ever written.',
    });

    await Review.create({
      book: bookFoundation._id,
      user: student._id,
      rating: 4,
      comment: 'A masterpiece of classic science fiction. The psychohistory concept is amazing.',
    });

    // 7. Create Borrow Records
    console.log('Seeding Borrow Records...');
    // Active borrow: Clean Code (approved)
    const recordActive = await BorrowRecord.create({
      book: bookCleanCode._id,
      user: student._id,
      status: 'borrowed',
      borrowDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // borrowed 5 days ago
      dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // due in 9 days
      fineAmount: 0,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // Overdue borrow: Foundation (borrowed 20 days ago, due 6 days ago)
    const recordOverdue = await BorrowRecord.create({
      book: bookFoundation._id,
      user: student._id,
      status: 'overdue',
      borrowDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      fineAmount: 12.00, // 6 days late * $2.00 per day
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    });

    // Completed borrow: Effective Java (returned)
    await BorrowRecord.create({
      book: bookEffectiveJava._id,
      user: student._id,
      status: 'returned',
      borrowDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      returnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // returned 1 day early
      fineAmount: 0,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    });

    // 8. Create Fines
    console.log('Seeding Fine Balance...');
    await Fine.create({
      user: student._id,
      borrowRecord: recordOverdue._id,
      amount: 12.00,
      status: 'unpaid',
    });

    // Create a resolved fine
    await Fine.create({
      user: student._id,
      borrowRecord: recordActive._id, // mock link
      amount: 4.00,
      status: 'paid',
      paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    });

    // 9. Create Reservations
    console.log('Seeding Reservations...');
    await Reservation.create({
      book: bookHeadFirstJava._id,
      user: student._id,
      status: 'pending',
    });

    // 10. Create In-App Notifications
    console.log('Seeding Notifications...');
    await Notification.create({
      user: student._id,
      message: `Your borrow request for "Clean Code" was approved. Due date is ${recordActive.dueDate.toLocaleDateString()}.`,
      type: 'borrow',
    });

    await Notification.create({
      user: student._id,
      message: `Overdue Alert: "Foundation" was due on ${recordOverdue.dueDate.toLocaleDateString()}. A fine of $2.00/day is accumulating.`,
      type: 'due',
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
};

seedDatabase();
