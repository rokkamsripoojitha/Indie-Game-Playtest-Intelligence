import { runInvestigationAgent } from '../services/agentService.js';
import { Issue } from '../models/Issue.js';
import { FeedbackReport } from '../models/FeedbackReport.js';

export const investigateTopic = async (req, res, next) => {
  try {
    const { buildId, topic = 'Tutorial Inventory' } = req.body;

    if (!buildId) {
      return res.status(400).json({
        success: false,
        message: 'buildId is required to run pre-playtest investigation.'
      });
    }

    const investigationResult = await runInvestigationAgent({
      studioId: req.studioId,
      buildId,
      topic: topic.trim(),
      developerUser: req.user
    });

    res.status(200).json({
      success: true,
      ...investigationResult
    });
  } catch (error) {
    next(error);
  }
};

export const createIssueFromProposal = async (req, res, next) => {
  try {
    const {
      title,
      description,
      severity = 'high',
      buildId,
      evidenceReportIds = [],
      suggestedFollowUpTest = ''
    } = req.body;

    if (!title || !description || !buildId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and buildId are required.'
      });
    }

    const issue = await Issue.create({
      studioId: req.studioId,
      buildScope: [buildId],
      title: title.trim(),
      description: `${description}\n\n[Suggested Follow-Up Test]: ${suggestedFollowUpTest}`,
      severity,
      status: 'confirmed', // Explicitly confirmed by developer via approval button
      evidenceReportIds,
      createdBy: req.user._id
    });

    // Mark evidence reports as linked
    if (evidenceReportIds.length > 0) {
      await FeedbackReport.updateMany(
        { _id: { $in: evidenceReportIds }, studioId: req.studioId },
        { $set: { status: 'linked' } }
      );
    }

    res.status(201).json({
      success: true,
      message: `Developer approved investigation and created confirmed tracking issue "${issue.title}".`,
      issue
    });
  } catch (error) {
    next(error);
  }
};
