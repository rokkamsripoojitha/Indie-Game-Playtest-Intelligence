import mongoose from 'mongoose';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { ReportLink } from '../models/ReportLink.js';
import { findSimilarFeedback } from '../services/vectorService.js';

export const getDuplicateCandidatesForReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const report = await FeedbackReport.findOne({
      _id: reportId,
      studioId: req.studioId
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found in this studio.' });
    }

    if (!report.embedding || report.embedding.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This report does not yet have an embedding generated.'
      });
    }

    // Find similar candidates within the same studio and build
    const searchResult = await findSimilarFeedback({
      studioId: req.studioId,
      buildId: report.buildId,
      excludeReportId: report._id,
      embedding: report.embedding,
      limit: 6,
      minSimilarity: 0.50
    });

    // Check if any candidates already have accepted or dismissed links
    const existingLinks = await ReportLink.find({
      studioId: req.studioId,
      sourceReportId: report._id
    });

    const linkMap = {};
    existingLinks.forEach(link => {
      linkMap[link.targetId.toString()] = {
        status: link.decisionStatus,
        reason: link.decisionReason,
        linkId: link._id
      };
    });

    const candidateCards = searchResult.results.map(c => ({
      ...c,
      existingDecision: linkMap[c.report._id.toString()] || null
    }));

    res.status(200).json({
      success: true,
      originalReport: {
        _id: report._id,
        title: report.title,
        description: report.description,
        stepsToReproduce: report.stepsToReproduce,
        expectedBehavior: report.expectedBehavior,
        actualBehavior: report.actualBehavior,
        createdAt: report.createdAt
      },
      candidates: candidateCards,
      engine: searchResult.engine
    });
  } catch (error) {
    next(error);
  }
};

export const reviewCandidateDecision = async (req, res, next) => {
  try {
    const { sourceReportId, targetId, targetType = 'report', decisionStatus, decisionReason = '', similarityScore } = req.body;

    if (!sourceReportId || !targetId || !['accepted', 'dismissed'].includes(decisionStatus)) {
      return res.status(400).json({
        success: false,
        message: 'sourceReportId, targetId, and decisionStatus ("accepted" or "dismissed") are required.'
      });
    }

    // Verify source report belongs to studio
    const sourceReport = await FeedbackReport.findOne({ _id: sourceReportId, studioId: req.studioId });
    if (!sourceReport) {
      return res.status(404).json({ success: false, message: 'Source report not found in this studio.' });
    }

    // Upsert link decision
    let link = await ReportLink.findOne({
      studioId: req.studioId,
      sourceReportId,
      targetId
    });

    if (link) {
      link.decisionStatus = decisionStatus;
      link.decisionReason = decisionReason;
      link.reviewedBy = req.user._id;
      if (similarityScore) link.similarityScore = similarityScore;
      await link.save();
    } else {
      link = await ReportLink.create({
        studioId: req.studioId,
        sourceReportId,
        targetType,
        targetId,
        relationshipType: 'duplicate',
        similarityScore: similarityScore || null,
        decisionStatus,
        reviewedBy: req.user._id,
        decisionReason
      });
    }

    // If accepted as duplicate, update report status to 'linked' without deleting original text
    if (decisionStatus === 'accepted') {
      sourceReport.status = 'linked';
      await sourceReport.save();
    }

    res.status(200).json({
      success: true,
      message: `Candidate has been ${decisionStatus}.`,
      link
    });
  } catch (error) {
    next(error);
  }
};
