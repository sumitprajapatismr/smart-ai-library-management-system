import { Router } from 'express';
import {
  createAuthor,
  getAuthors,
  getAuthor,
  updateAuthor,
  deleteAuthor,
} from '../controllers/authorController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.route('/')
  .post(protect, authorize('admin', 'librarian'), createAuthor)
  .get(getAuthors);

router.route('/:id')
  .get(getAuthor)
  .put(protect, authorize('admin', 'librarian'), updateAuthor)
  .delete(protect, authorize('admin', 'librarian'), deleteAuthor);

export default router;
