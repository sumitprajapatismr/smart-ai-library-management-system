import { Router } from 'express';
import {
  addReview,
  getBookReviews,
  deleteReview,
} from '../controllers/reviewController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.route('/:bookId')
  .post(protect, authorize('student'), addReview)
  .get(getBookReviews);

router.delete('/:id', protect, deleteReview);

export default router;
