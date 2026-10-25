import { Router } from 'express';
import {
  askSetupQuestion,
  getConversationHistory,
  getConversationById
} from '../controllers/chatController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// Testers and Developers can ask setup questions scoped to a build
router.post('/ask', requireStudioRole(['tester', 'developer', 'studio_admin']), verifyCsrf, askSetupQuestion);
router.get('/history', requireStudioRole(['tester', 'developer', 'studio_admin']), getConversationHistory);
router.get('/:conversationId', requireStudioRole(['tester', 'developer', 'studio_admin']), getConversationById);

export default router;
