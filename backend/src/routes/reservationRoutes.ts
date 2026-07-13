import { Router } from 'express';
import {
  reserveBook,
  approveReservation,
  cancelReservation,
  getMyReservations,
  getAllReservations,
} from '../controllers/reservationController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.post('/reserve/:bookId', protect, authorize('student'), reserveBook);
router.put('/approve/:reservationId', protect, authorize('admin', 'librarian'), approveReservation);
router.put('/cancel/:reservationId', protect, cancelReservation);
router.get('/my-reservations', protect, authorize('student'), getMyReservations);
router.get('/', protect, authorize('admin', 'librarian'), getAllReservations);

export default router;
