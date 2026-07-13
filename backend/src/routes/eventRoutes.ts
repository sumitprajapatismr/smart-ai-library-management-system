import { Router } from 'express';
import {
  getAllEvents,
  registerForEvent,
  downloadEventCertificate,
  createEvent
} from '../controllers/eventController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.get('/', protect, getAllEvents);
router.post('/register/:eventId', protect, registerForEvent);
router.get('/certificate/:eventId', protect, downloadEventCertificate);
router.post('/', protect, authorize('admin', 'librarian'), createEvent);

export default router;
