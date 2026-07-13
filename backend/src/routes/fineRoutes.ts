import { Router } from 'express';
import {
  getMyFines,
  payFine,
  getAllFines,
} from '../controllers/fineController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/my-fines', authorize('student'), getMyFines);
router.put('/pay/:fineId', authorize('student'), payFine);
router.get('/', authorize('admin', 'librarian'), getAllFines);

export default router;
