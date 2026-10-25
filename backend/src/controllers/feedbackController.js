import mongoose from 'mongoose';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { PlaytestSession } from '../models/PlaytestSession.js';
import { Build } from '../models/Build.js';
import { ConsentRecord } from '../models/ConsentRecord.js';
import { generateEmbedding } from '../services/embeddingService.js';
import { findSimilarFeedback } from '../services/vectorService.js';

export const submitFeedback = async (req, res, next) => {
  try {
    const {
      buildId,
      sessionId,
      title,
      description,
      stepsToReproduce = '',
      expectedBehavior = '',
      actualBehavior = '',
      attachments = [],
      consentGranted = true
    } = req.body;

    if (!buildId || !sessionId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'buildId, sessionId, title, and problem description are required.'
      });
    }

    // Validate build and session belong to the active studio
    const build = await Build.findOne({ _id: buildId, studioId: req.studioId });
    if (!build) {
      return res.status(404).json({ success: false, message: 'Build not found in this studio.' });
    }

    const session = await PlaytestSession.findOne({ _id: sessionId, studioId: req.studioId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found in this studio.' });
    }

    // Record consent record
    if (consentGranted) {
      await ConsentRecord.create({
        userId: req.user._id,
        sessionId: session._id,
        consentType: 'feedback_collection',
        consentStatus: 'granted',
        ipAddress: req.ip || ''
      });
    }

    // Generate real embedding for feedback title + description + reproduction steps
    const fullFeedbackText = `${title}\n${description}\n${stepsToReproduce}\n${actualBehavior}`;
    const { embedding, model, dimension, provider } = await generateEmbedding(fullFeedbackText);

    // Save report preserving full original text
    const report = await FeedbackReport.create({
      studioId: req.studioId,
      buildId,
      sessionId,
      testerId: req.user._id,
      title: title.trim(),
      description: description.trim(),
      stepsToReproduce: stepsToReproduce.trim(),
      expectedBehavior: expectedBehavior.trim(),
      actualBehavior: actualBehavior.trim(),
      attachments,
      embedding,
      embeddingModel: model,
      embeddingDimension: dimension,
      embeddingStatus: 'completed',
      status: 'submitted'
    });

    // Query for semantic duplicate candidates
    const duplicateDiscovery = await findSimilarFeedback({
      studioId: req.studioId,
      buildId,
      excludeReportId: report._id,
      embedding,
      limit: 4,
      minSimilarity: 0.55
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully.',
      report: {
        _id: report._id,
        title: report.title,
        description: report.description,
        stepsToReproduce: report.stepsToReproduce,
        expectedBehavior: report.expectedBehavior,
        actualBehavior: report.actualBehavior,
        status: report.status,
        createdAt: report.createdAt
      },
      embeddingMetadata: {
        model,
        dimension,
        provider
      },
      duplicateDiscovery
    });
  } catch (error) {
    next(error);
  }
};

export const listFeedback = async (req, res, next) => {
  try {
    const isDeveloperOrAdmin = ['developer', 'studio_admin'].includes(req.membership?.role);
    const { buildId, sessionId } = req.query;

    let query = { studioId: req.studioId };
    if (buildId) query.buildId = buildId;
    if (sessionId) query.sessionId = sessionId;

    if (!isDeveloperOrAdmin) {
      // Tester access control:
      if (sessionId) {
        const session = await PlaytestSession.findById(sessionId);
        if (session && session.feedbackSharingPolicy === 'shared') {
          // If session feedback sharing policy is 'shared', tester can view session reports
        } else {
          query.testerId = req.user._id;
        }
      } else {
        query.testerId = req.user._id;
      }
    }

    const reports = await FeedbackReport.find(query)
      .populate('buildId', 'version buildName')
      .populate('sessionId', 'title accessCode')
      .populate('testerId', 'name email')
      .select('-embedding') // Do not transfer raw vector floats to client list
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
};

export const getFeedbackById = async (req, res, next) => {
  try {
    const report = await FeedbackReport.findOne({
      _id: req.params.reportId,
      studioId: req.studioId
    })
      .populate('buildId', 'version buildName')
      .populate('sessionId', 'title accessCode feedbackSharingPolicy')
      .populate('testerId', 'name email')
      .select('-embedding');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Feedback report not found.' });
    }

    // Tester authorization check
    const isDeveloperOrAdmin = ['developer', 'studio_admin'].includes(req.membership?.role);
    if (!isDeveloperOrAdmin) {
      const isOwner = report.testerId?._id?.toString() === req.user._id.toString();
      const isSharedSession = report.sessionId?.feedbackSharingPolicy === 'shared';
      if (!isOwner && !isSharedSession) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are only authorized to view your own feedback reports.'
        });
      }
    }

    res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    next(error);
  }
};
