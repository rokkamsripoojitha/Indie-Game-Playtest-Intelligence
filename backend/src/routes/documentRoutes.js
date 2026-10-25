import { Router } from 'express';
import { uploadDocument, listDocuments, getDocumentById } from '../controllers/documentController.js';
import { requireAuth, requireVerified } from '../middleware/auth.js';
import { requireStudioRole } from '../middleware/rbac.js';
import { verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.use(requireAuth);
router.use(requireVerified);

// All studio members (including testers) can view documents permitted for their builds
router.get('/', requireStudioRole(['tester', 'developer', 'studio_admin']), listDocuments);
router.get('/:documentId', requireStudioRole(['tester', 'developer', 'studio_admin']), getDocumentById);

// Developers and Admins can upload and index documentation
router.post('/upload', requireStudioRole(['developer', 'studio_admin']), verifyCsrf, uploadDocument);

export default router;
