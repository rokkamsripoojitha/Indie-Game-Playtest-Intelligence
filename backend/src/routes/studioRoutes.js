import { Router } from 'express';
import { createStudio, getMyStudios, getStudioById } from '../controllers/studioController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

router.post('/', verifyCsrf, createStudio);
router.get('/', getMyStudios);
router.get('/:studioId', requireStudioRole(['tester', 'developer', 'studio_admin']), getStudioById);

export default router;
