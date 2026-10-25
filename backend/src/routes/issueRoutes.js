import { Router } from 'express';
import {
  listIssues,
  createIssue,
  getIssueById,
  confirmIssue,
  verifyFix
} from '../controllers/issueController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole, requireDeveloperOnly } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// Developers and Studio Admins can view and draft issues
router.get('/', requireStudioRole(['developer', 'studio_admin']), listIssues);
router.get('/:issueId', requireStudioRole(['developer', 'studio_admin']), getIssueById);
router.post('/', requireStudioRole(['developer', 'studio_admin']), verifyCsrf, createIssue);

// DEVELOPER-ONLY ACTIONS: Confirm issue and verify fix (Admins without developer role are strictly rejected)
router.patch(
  '/:issueId/confirm',
  requireStudioRole(['developer', 'studio_admin']),
  requireDeveloperOnly,
  verifyCsrf,
  confirmIssue
);

router.patch(
  '/:issueId/verify-fix',
  requireStudioRole(['developer', 'studio_admin']),
  requireDeveloperOnly,
  verifyCsrf,
  verifyFix
);

export default router;
