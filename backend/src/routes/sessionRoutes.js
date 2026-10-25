import { Router } from 'express';
import {
  listSessions,
  createSession,
  joinSessionWithCode,
  getSessionById
} from '../controllers/sessionController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// Join playtest session using access code (testers)
router.post('/join', verifyCsrf, joinSessionWithCode);

// List sessions for studio (role-filtered in controller)
router.get('/', requireStudioRole(['tester', 'developer', 'studio_admin']), listSessions);
router.get('/:sessionId', requireStudioRole(['tester', 'developer', 'studio_admin']), getSessionById);

// Developers and Admins can create sessions
router.post('/', requireStudioRole(['developer', 'studio_admin']), verifyCsrf, createSession);

export default router;
