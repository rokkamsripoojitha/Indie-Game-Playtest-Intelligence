import { Router } from 'express';
import {
  register,
  verify,
  login,
  logout,
  getMe,
  forgotPassword,
  handleResetPassword,
  getCsrfToken
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { setCsrfToken, verifyCsrf } from '../middleware/csrf.js';

const router = Router();

router.get('/csrf-token', setCsrfToken, getCsrfToken);
router.post('/register', authLimiter, verifyCsrf, register);
router.post('/verify-email', authLimiter, verifyCsrf, verify);
router.post('/login', authLimiter, verifyCsrf, login);
router.post('/logout', requireAuth, verifyCsrf, logout);
router.get('/me', requireAuth, getMe);
router.post('/forgot-password', authLimiter, verifyCsrf, forgotPassword);
router.post('/reset-password', authLimiter, verifyCsrf, handleResetPassword);

export default router;
