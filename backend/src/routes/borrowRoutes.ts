import { Router } from 'express';
import {
  requestBorrowBook,
  approveBorrowRequest,
  rejectBorrowRequest,
  returnBook,
  getMyBorrowHistory,
  getAllBorrowRecords,
  qrBorrow,
  qrReturn,
  updateProgress,
  updateNotes,
  addBookmark,
  deleteBookmark,
} from '../controllers/borrowController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

// QR Actions
router.post('/qr-borrow', protect, authorize('student'), qrBorrow);
router.post('/qr-return', protect, authorize('student'), qrReturn);

// Progress, notes and bookmarks
router.put('/record/:recordId/progress', protect, authorize('student'), updateProgress);
router.put('/record/:recordId/notes', protect, authorize('student'), updateNotes);
router.post('/record/:recordId/bookmarks', protect, authorize('student'), addBookmark);
router.delete('/record/:recordId/bookmarks/:bookmarkId', protect, authorize('student'), deleteBookmark);

// Standard Actions
router.post('/request/:bookId', protect, authorize('student'), requestBorrowBook);
router.put('/approve/:recordId', protect, authorize('admin', 'librarian'), approveBorrowRequest);
router.put('/cancel/:recordId', protect, authorize('admin', 'librarian'), rejectBorrowRequest);
router.put('/return/:recordId', protect, authorize('admin', 'librarian'), returnBook);
router.get('/my-history', protect, authorize('student'), getMyBorrowHistory);
router.get('/', protect, authorize('admin', 'librarian'), getAllBorrowRecords);

export default router;
