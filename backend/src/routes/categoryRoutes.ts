import { Router } from 'express';
import {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.route('/')
  .post(protect, authorize('admin', 'librarian'), createCategory)
  .get(getCategories);

router.route('/:id')
  .get(getCategory)
  .put(protect, authorize('admin', 'librarian'), updateCategory)
  .delete(protect, authorize('admin', 'librarian'), deleteCategory);

export default router;
