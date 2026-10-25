import { Router } from 'express';
import { createInvitation, acceptInvitation } from '../controllers/membershipController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// Developers can issue studio invitations
router.post('/issue', requireStudioRole(['developer']), verifyCsrf, createInvitation);
// Any authenticated & verified user can accept an invitation sent to their email
router.post('/accept', verifyCsrf, acceptInvitation);

export default router;
