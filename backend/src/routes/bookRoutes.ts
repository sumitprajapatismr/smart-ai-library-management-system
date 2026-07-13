import { Router } from 'express';
import {
  createBook,
  getBooks,
  getBook,
  updateBook,
  deleteBook,
  getBookStats,
  getRecentBooks,
  getTrendingBooks,
  getPopularBooks,
  getRecommendedBooks,
} from '../controllers/bookController';
import { protect, authorize } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

const uploadFields = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 }
]);

// Special stats and lists routes (Must be declared BEFORE /:id to avoid conflict)
router.get('/stats', protect, getBookStats);
router.get('/recent', getRecentBooks);
router.get('/trending', getTrendingBooks);
router.get('/popular', getPopularBooks);
router.get('/recommended', protect, getRecommendedBooks);

router.route('/')
  .post(protect, authorize('admin', 'librarian'), uploadFields, createBook)
  .get(getBooks);

router.route('/:id')
  .get(getBook)
  .put(protect, authorize('admin', 'librarian'), uploadFields, updateBook)
  .delete(protect, authorize('admin', 'librarian'), deleteBook);

export default router;
