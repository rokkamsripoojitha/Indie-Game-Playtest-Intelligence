import { Router } from 'express';
import {
  getDuplicateCandidatesForReport,
  reviewCandidateDecision
} from '../controllers/duplicateController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// Only developers and studio admins can inspect and review duplicate candidates
router.get('/candidates/:reportId', requireStudioRole(['developer', 'studio_admin']), getDuplicateCandidatesForReport);
router.post('/decision', requireStudioRole(['developer', 'studio_admin']), verifyCsrf, reviewCandidateDecision);

export default router;
