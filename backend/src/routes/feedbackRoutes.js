import { Router } from 'express';
import { submitFeedback, listFeedback, getFeedbackById } from '../controllers/feedbackController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// Any studio member (tester, developer, admin) can submit feedback for a session they participate in
router.post('/', requireStudioRole(['tester', 'developer', 'studio_admin']), verifyCsrf, submitFeedback);

// List and view feedback (role-enforced in controller)
router.get('/', requireStudioRole(['tester', 'developer', 'studio_admin']), listFeedback);
router.get('/:reportId', requireStudioRole(['tester', 'developer', 'studio_admin']), getFeedbackById);

export default router;
