import { Issue } from '../models/Issue.js';
import { FeedbackReport } from '../models/FeedbackReport.js';

export const listIssues = async (req, res, next) => {
  try {
    const { status, buildId } = req.query;
    const query = { studioId: req.studioId };
    if (status) query.status = status;
    if (buildId) query.buildScope = buildId;

    const issues = await Issue.find(query)
      .populate('buildScope', 'version buildName')
      .populate('evidenceReportIds', 'title description status')
      .populate('verificationDetails.verifiedBy', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      issues
    });
  } catch (error) {
    next(error);
  }
};

export const createIssue = async (req, res, next) => {
  try {
    const { title, description, severity = 'medium', buildScope = [], evidenceReportIds = [] } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Issue title and description are required.'
      });
    }

    const issue = await Issue.create({
      studioId: req.studioId,
      buildScope,
      title: title.trim(),
      description: description.trim(),
      severity,
      status: 'unconfirmed',
      evidenceReportIds,
      createdBy: req.user._id
    });

    // Mark evidence reports as triaged or linked
    if (evidenceReportIds.length > 0) {
      await FeedbackReport.updateMany(
        { _id: { $in: evidenceReportIds }, studioId: req.studioId },
        { $set: { status: 'linked' } }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Issue created successfully.',
      issue
    });
  } catch (error) {
    next(error);
  }
};

export const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findOne({
      _id: req.params.issueId,
      studioId: req.studioId
    })
      .populate('buildScope', 'version buildName')
      .populate('evidenceReportIds', 'title description stepsToReproduce expectedBehavior actualBehavior status')
      .populate('verificationDetails.verifiedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found in this studio.' });
    }

    res.status(200).json({
      success: true,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// DEVELOPER-ONLY ACTION: Confirm Issue
export const confirmIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findOne({
      _id: req.params.issueId,
      studioId: req.studioId
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    issue.status = 'confirmed';
    await issue.save();

    res.status(200).json({
      success: true,
      message: `Issue "${issue.title}" has been confirmed by developer.`,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// DEVELOPER-ONLY ACTION: Mark Fix as Verified
export const verifyFix = async (req, res, next) => {
  try {
    const { notes = '' } = req.body;
    const issue = await Issue.findOne({
      _id: req.params.issueId,
      studioId: req.studioId
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found.' });
    }

    issue.status = 'verified_fix';
    issue.verificationDetails = {
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
      notes: notes.trim()
    };
    await issue.save();

    res.status(200).json({
      success: true,
      message: `Fix for issue "${issue.title}" marked as verified.`,
      issue
    });
  } catch (error) {
    next(error);
  }
};
