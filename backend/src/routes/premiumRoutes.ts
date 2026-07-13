import { Router } from 'express';
import {
  reserveStudyRoom,
  getMyReservations,
  getActiveReservations,
  startChallenge,
  logChallengeProgress,
  getChallengeLeaderboard,
  moodRecommendations,
  getKnowledgeGraph,
  getHeatmapStats
} from '../controllers/premiumController';
import { protect, authorize } from '../middlewares/auth';

const router = Router();

// Study Room bookings
router.post('/rooms/reserve', protect, reserveStudyRoom);
router.get('/rooms/my-reservations', protect, getMyReservations);
router.get('/rooms/active', protect, getActiveReservations);

// Challenges
router.post('/challenge/start', protect, startChallenge);
router.post('/challenge/progress', protect, logChallengeProgress);
router.get('/challenge/leaderboard', getChallengeLeaderboard);

// AI & Visuals
router.post('/mood-recommend', protect, moodRecommendations);
router.get('/knowledge-graph', getKnowledgeGraph);
router.get('/heatmap', getHeatmapStats);

export default router;
