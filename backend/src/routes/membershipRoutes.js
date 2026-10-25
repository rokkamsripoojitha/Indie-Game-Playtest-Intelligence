import { Router } from 'express';
import {
  listMembers,
  updateMemberRole,
  removeMember
} from '../controllers/membershipController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// Developers (including studio owners) can manage memberships
router.get('/:studioId', requireStudioRole(['developer']), listMembers);
router.patch('/:studioId/:membershipId', requireStudioRole(['developer']), verifyCsrf, updateMemberRole);
router.delete('/:studioId/:membershipId', requireStudioRole(['developer']), verifyCsrf, removeMember);

export default router;
