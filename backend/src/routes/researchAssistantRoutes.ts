import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import {
  uploadResearchDocument,
  askResearchAssistant,
  getResearchDocuments,
  deleteResearchDocument,
} from '../controllers/researchAssistantController';

const router = Router();

// Protect all research assistant routes
router.use(protect);

router.post('/upload', upload.single('file'), uploadResearchDocument);
router.post('/ask', askResearchAssistant);
router.get('/documents', getResearchDocuments);
router.delete('/documents/:docId', deleteResearchDocument);

export default router;
