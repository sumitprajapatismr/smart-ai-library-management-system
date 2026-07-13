import { Router } from 'express';
import {
  getStaffDashboardStats,
  getStudentDashboardStats,
  getReportsData,
  submitContactForm,
} from '../controllers/dashboardController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/contact', submitContactForm);

// Protected routes
router.use(protect);

router.get('/staff', authorize('admin', 'librarian'), getStaffDashboardStats);
router.get('/student', authorize('student'), getStudentDashboardStats);
router.get('/reports', authorize('admin', 'librarian'), getReportsData);

export default router;
