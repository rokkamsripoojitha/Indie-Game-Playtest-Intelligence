import { Router } from 'express';
import { listBuilds, createBuild, getBuildById, updateBuild } from '../controllers/buildController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// All studio members can view builds
router.get('/', requireStudioRole(['tester', 'developer', 'studio_admin']), listBuilds);
router.get('/:buildId', requireStudioRole(['tester', 'developer', 'studio_admin']), getBuildById);

// Developers and studio admins can create and update builds
router.post('/', requireStudioRole(['developer', 'studio_admin']), verifyCsrf, createBuild);
router.patch('/:buildId', requireStudioRole(['developer', 'studio_admin']), verifyCsrf, updateBuild);

export default router;
