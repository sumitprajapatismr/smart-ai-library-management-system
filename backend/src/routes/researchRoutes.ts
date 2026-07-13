import { Router } from 'express';
import {
  getAllPapers,
  bookmarkPaper,
  getMyBookmarkedPapers,
  createResearchPaper
} from '../controllers/researchController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', protect, getAllPapers);
router.post('/bookmark/:paperId', protect, bookmarkPaper);
router.get('/bookmarks', protect, getMyBookmarkedPapers);
router.post('/', protect, authorize('admin', 'librarian'), createResearchPaper);

export default router;
