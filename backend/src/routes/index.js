import { Router } from 'express';
import authRoutes from './authRoutes.js';
import studioRoutes from './studioRoutes.js';
import membershipRoutes from './membershipRoutes.js';
import invitationRoutes from './invitationRoutes.js';
import buildRoutes from './buildRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import feedbackRoutes from './feedbackRoutes.js';
import duplicateRoutes from './duplicateRoutes.js';
import issueRoutes from './issueRoutes.js';
import documentRoutes from './documentRoutes.js';
import chatRoutes from './chatRoutes.js';
import agentRoutes from './agentRoutes.js';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/studios', studioRoutes);
router.use('/memberships', membershipRoutes);
router.use('/invitations', invitationRoutes);
router.use('/builds', buildRoutes);
router.use('/sessions', sessionRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/duplicates', duplicateRoutes);
router.use('/issues', issueRoutes);
router.use('/documents', documentRoutes);
router.use('/chat', chatRoutes);
router.use('/agent', agentRoutes);

export default router;
