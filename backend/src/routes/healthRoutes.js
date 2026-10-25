import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController.js';

const router = Router();

// Public health and readiness check
router.get('/', getHealthStatus);

export default router;
