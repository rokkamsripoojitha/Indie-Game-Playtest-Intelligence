import { Router } from 'express';
import { investigateTopic, createIssueFromProposal } from '../controllers/agentController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole, requireDeveloperOnly } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// Only authorized developers can run the AI investigation agent workflow
router.post(
  '/investigate',
  requireStudioRole(['developer', 'studio_admin']),
  requireDeveloperOnly,
  verifyCsrf,
  investigateTopic
);

// Explicit developer action to accept proposal and create a confirmed issue
router.post(
  '/approve-issue',
  requireStudioRole(['developer', 'studio_admin']),
  requireDeveloperOnly,
  verifyCsrf,
  createIssueFromProposal
);

export default router;
