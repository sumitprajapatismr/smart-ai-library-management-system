import { Router } from 'express';
import {
  aiChat,
  aiSmartSearch,
  getAiRecommendations,
  generateReadingPlan,
  saveReadingPlan,
  getReadingPlans,
  updateReadingPlanProgress,
  deleteReadingPlan,
  generateQuiz,
  generateFlashcards,
  explainTopic,
  compareBooks,
  getCareerRecommendations,
  getWeeklyReport,
} from '../controllers/aiController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

router.post('/chat', protect, aiChat);
router.post('/search', aiSmartSearch);
router.get('/recommendations', protect, authorize('student'), getAiRecommendations);

// Saved Reading Plans CRUD
router.post('/reading-plan', protect, authorize('student'), generateReadingPlan);
router.post('/reading-plan/save', protect, authorize('student'), saveReadingPlan);
router.get('/reading-plan/saved', protect, authorize('student'), getReadingPlans);
router.put('/reading-plan/:planId/progress', protect, authorize('student'), updateReadingPlanProgress);
router.delete('/reading-plan/:planId', protect, authorize('student'), deleteReadingPlan);

// Study Tools
router.post('/quiz', protect, authorize('student'), generateQuiz);
router.post('/flashcards', protect, authorize('student'), generateFlashcards);
router.post('/explain', protect, explainTopic);
router.post('/compare', protect, compareBooks);
router.post('/career', protect, getCareerRecommendations);
router.get('/weekly-report', protect, authorize('student'), getWeeklyReport);

export default router;
