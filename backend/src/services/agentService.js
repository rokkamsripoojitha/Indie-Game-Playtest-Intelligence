import mongoose from 'mongoose';
import { z } from 'zod';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { FeedbackReport } from '../models/FeedbackReport.js';
import { Issue } from '../models/Issue.js';
import { ReportLink } from '../models/ReportLink.js';
import { PlaytestSession } from '../models/PlaytestSession.js';
import { Build } from '../models/Build.js';
import { generateEmbedding } from './embeddingService.js';
import { cosineSimilarity } from '../utils/vectorMath.js';
import { config } from '../config/env.js';

// Formal Zod Schemas for LangChain Agent Tools
export const FindFeedbackSchema = z.object({
  studioId: z.string().describe('The authenticated Studio ObjectId'),
  buildId: z.string().describe('The target Build ObjectId'),
  topic: z.string().describe('Playtest friction topic, e.g. "Tutorial Inventory"')
});

export const ReadIssueStateSchema = z.object({
  studioId: z.string().describe('The authenticated Studio ObjectId'),
  reportIds: z.array(z.string()).describe('Array of Feedback Report ObjectIds to inspect')
});

export const CountAffectedSessionsSchema = z.object({
  studioId: z.string().describe('The authenticated Studio ObjectId'),
  reportIds: z.array(z.string()).describe('Array of Feedback Report ObjectIds')
});

/**
 * TOOL 1: findFeedback(buildId, topic)
 * Retrieves authorized feedback relevant to a topic and groups potentially related reports into evidence-backed clusters.
 */
export const findFeedback = async ({ studioId, buildId, topic }) => {
  const sId = new mongoose.Types.ObjectId(studioId);
  const bId = new mongoose.Types.ObjectId(buildId);

  // Generate embedding for topic to find semantically relevant reports
  const { embedding: topicVector } = await generateEmbedding(topic);

  const reports = await FeedbackReport.find({
    studioId: sId,
    buildId: bId
  }).select('title description stepsToReproduce expectedBehavior actualBehavior sessionId testerId embedding status createdAt').lean();

  if (!reports || reports.length === 0) {
    return {
      clusterFound: false,
      reports: [],
      clusterTopic: topic,
      summary: `No feedback reports found for build ID ${buildId}.`
    };
  }

  // Score each report against topic
  const scored = reports.map(r => {
    let score = 0;
    if (r.embedding && r.embedding.length > 0) {
      score = cosineSimilarity(topicVector, r.embedding);
    } else {
      // Basic text inclusion if embedding was not generated
      const text = `${r.title} ${r.description}`.toLowerCase();
      score = text.includes(topic.toLowerCase()) ? 0.7 : 0.2;
    }
    return {
      _id: r._id,
      title: r.title,
      description: r.description,
      stepsToReproduce: r.stepsToReproduce,
      expectedBehavior: r.expectedBehavior,
      actualBehavior: r.actualBehavior,
      sessionId: r.sessionId,
      testerId: r.testerId,
      status: r.status,
      similarityScore: Number(score.toFixed(4))
    };
  });

  // Filter relevant reports above threshold
  const matched = scored.filter(r => r.similarityScore >= 0.45).sort((a, b) => b.similarityScore - a.similarityScore);

  return {
    clusterFound: matched.length > 0,
    matchedCount: matched.length,
    clusterTopic: topic,
    reports: matched,
    summary: `Identified cluster of ${matched.length} report(s) matching topic "${topic}".`
  };
};

/**
 * TOOL 2: readIssueState(reportIds)
 * Reads authorized issue states and report links, distinguishing confirmed issues from unresolved reports and proposed relationships.
 */
export const readIssueState = async ({ studioId, reportIds }) => {
  if (!reportIds || reportIds.length === 0) {
    return {
      hasConfirmedIssue: false,
      confirmedIssues: [],
      pendingLinks: [],
      unresolvedReportIds: [],
      summary: 'No reports provided to inspect issue states.'
    };
  }

  const sId = new mongoose.Types.ObjectId(studioId);
  const validReportObjectIds = reportIds.map(id => new mongoose.Types.ObjectId(id));

  // Find issues containing any of these reports as evidence
  const existingIssues = await Issue.find({
    studioId: sId,
    evidenceReportIds: { $in: validReportObjectIds }
  }).select('title description severity status evidenceReportIds verificationDetails createdBy createdAt').lean();

  // Find report links for these reports
  const links = await ReportLink.find({
    studioId: sId,
    $or: [
      { sourceReportId: { $in: validReportObjectIds } },
      { targetId: { $in: validReportObjectIds } }
    ]
  }).select('sourceReportId targetType targetId relationshipType similarityScore decisionStatus decisionReason').lean();

  const linkedReportIdSet = new Set();
  existingIssues.forEach(issue => {
    (issue.evidenceReportIds || []).forEach(id => linkedReportIdSet.add(id.toString()));
  });

  const unresolvedReportIds = reportIds.filter(id => !linkedReportIdSet.has(id.toString()));
  const confirmedIssues = existingIssues.filter(i => i.status === 'confirmed' || i.status === 'verified_fix');

  return {
    hasConfirmedIssue: confirmedIssues.length > 0,
    confirmedIssues,
    allLinkedIssues: existingIssues,
    pendingLinks: links,
    unresolvedReportIds,
    summary: `Found ${existingIssues.length} existing issue(s) (${confirmedIssues.length} confirmed) and ${unresolvedReportIds.length} unresolved report(s).`
  };
};

/**
 * TOOL 3: countAffectedSessions(reportIds)
 * Counts distinct, authorized playtest sessions associated with the supplied reports.
 */
export const countAffectedSessions = async ({ studioId, reportIds }) => {
  if (!reportIds || reportIds.length === 0) {
    return {
      distinctSessionCount: 0,
      totalReportCount: 0,
      sessions: [],
      summary: 'No reports provided to count affected sessions.'
    };
  }

  const sId = new mongoose.Types.ObjectId(studioId);
  const validReportObjectIds = reportIds.map(id => new mongoose.Types.ObjectId(id));

  const reports = await FeedbackReport.find({
    _id: { $in: validReportObjectIds },
    studioId: sId
  }).select('sessionId title testerId').lean();

  const distinctSessionIds = [...new Set(reports.map(r => r.sessionId?.toString()).filter(Boolean))];

  const sessions = await PlaytestSession.find({
    _id: { $in: distinctSessionIds.map(id => new mongoose.Types.ObjectId(id)) },
    studioId: sId
  }).select('title accessCode status startDate endDate').lean();

  return {
    distinctSessionCount: distinctSessionIds.length,
    totalReportCount: reports.length,
    sessions,
    summary: `Feedback originated from ${distinctSessionIds.length} distinct playtest session(s) across ${reports.length} total report(s).`
  };
};

/**
 * LangChain DynamicStructuredTool Definitions with Zod Schemas
 */
export const findFeedbackTool = new DynamicStructuredTool({
  name: 'findFeedback',
  description: 'Retrieves authorized feedback relevant to a topic and groups potentially related reports into evidence-backed clusters.',
  schema: FindFeedbackSchema,
  func: async (input) => JSON.stringify(await findFeedback(input))
});

export const readIssueStateTool = new DynamicStructuredTool({
  name: 'readIssueState',
  description: 'Reads authorized issue states and report links, distinguishing confirmed issues from unresolved reports.',
  schema: ReadIssueStateSchema,
  func: async (input) => JSON.stringify(await readIssueState(input))
});

export const countAffectedSessionsTool = new DynamicStructuredTool({
  name: 'countAffectedSessions',
  description: 'Counts distinct, authorized playtest sessions associated with the supplied reports.',
  schema: CountAffectedSessionsSchema,
  func: async (input) => JSON.stringify(await countAffectedSessions(input))
});

export const investigationAgentTools = [
  findFeedbackTool,
  readIssueStateTool,
  countAffectedSessionsTool
];

/**
 * Run the complete AI Agent Investigation Workflow
 * Sequence: findFeedback -> readIssueState -> countAffectedSessions -> Evidence-Based Proposal
 */
export const runInvestigationAgent = async ({ studioId, buildId, topic, developerUser }) => {
  const executionTrace = [];
  const startTime = Date.now();

  const build = await Build.findOne({
    _id: new mongoose.Types.ObjectId(buildId),
    studioId: new mongoose.Types.ObjectId(studioId)
  }).select('version buildName');

  if (!build) {
    throw new Error('Specified build does not exist or does not belong to this studio.');
  }

  // STEP 1: Execute Tool 1 - findFeedback
  const t1Start = Date.now();
  let feedbackResult;
  try {
    feedbackResult = await findFeedback({ studioId, buildId, topic });
    executionTrace.push({
      tool: 'findFeedback',
      inputs: { buildId, topic, buildVersion: build.version },
      status: 'success',
      executionMs: Date.now() - t1Start,
      summary: feedbackResult.summary,
      matchedCount: feedbackResult.matchedCount
    });
  } catch (err) {
    executionTrace.push({
      tool: 'findFeedback',
      inputs: { buildId, topic },
      status: 'failed',
      executionMs: Date.now() - t1Start,
      error: err.message
    });
    throw err;
  }

  if (!feedbackResult.clusterFound || feedbackResult.reports.length === 0) {
    return {
      status: 'no_data',
      investigationTitle: `Investigation: ${topic}`,
      scope: { buildId, buildVersion: build.version, topic },
      message: `No feedback reports matched the topic "${topic}" in build ${build.version}. Cannot form an investigation proposal without player evidence.`,
      executionTrace,
      proposal: null
    };
  }

  const reportIds = feedbackResult.reports.map(r => r._id.toString());

  // STEP 2: Execute Tool 2 - readIssueState
  const t2Start = Date.now();
  let issueStateResult;
  try {
    issueStateResult = await readIssueState({ studioId, reportIds });
    executionTrace.push({
      tool: 'readIssueState',
      inputs: { reportCount: reportIds.length },
      status: 'success',
      executionMs: Date.now() - t2Start,
      summary: issueStateResult.summary,
      hasConfirmedIssue: issueStateResult.hasConfirmedIssue
    });
  } catch (err) {
    executionTrace.push({
      tool: 'readIssueState',
      inputs: { reportCount: reportIds.length },
      status: 'failed',
      executionMs: Date.now() - t2Start,
      error: err.message
    });
    throw err;
  }

  // STEP 3: Execute Tool 3 - countAffectedSessions
  const t3Start = Date.now();
  let sessionCountResult;
  try {
    sessionCountResult = await countAffectedSessions({ studioId, reportIds });
    executionTrace.push({
      tool: 'countAffectedSessions',
      inputs: { reportCount: reportIds.length },
      status: 'success',
      executionMs: Date.now() - t3Start,
      summary: sessionCountResult.summary,
      distinctSessionCount: sessionCountResult.distinctSessionCount
    });
  } catch (err) {
    executionTrace.push({
      tool: 'countAffectedSessions',
      inputs: { reportCount: reportIds.length },
      status: 'failed',
      executionMs: Date.now() - t3Start,
      error: err.message
    });
    throw err;
  }

  // STEP 4: Synthesize Evidence-Based Investigation Proposal
  // Separate concepts:
  // Frequency: distinctSessionCount
  // Severity: pending human assessment
  // Confidence: average similarity score
  const avgSimilarity = (feedbackResult.reports.reduce((acc, r) => acc + r.similarityScore, 0) / feedbackResult.reports.length).toFixed(2);

  // Missing reproduction details analysis
  const reportsMissingSteps = feedbackResult.reports.filter(r => !r.stepsToReproduce || r.stepsToReproduce.trim().length < 5);
  const missingReproductionDetails = reportsMissingSteps.length > 0
    ? `${reportsMissingSteps.length} of ${feedbackResult.reports.length} report(s) lack explicit reproduction steps.`
    : 'All clustered reports include reproduction steps.';

  // Determine facts vs hypotheses
  const knownFacts = [
    `${feedbackResult.reports.length} tester report(s) in Build ${build.version} describe friction with "${topic}".`,
    `Friction was reproduced across ${sessionCountResult.distinctSessionCount} distinct playtest session(s).`,
    issueStateResult.hasConfirmedIssue
      ? `A confirmed issue already tracks part of this cluster: "${issueStateResult.confirmedIssues[0].title}".`
      : 'No confirmed issue currently tracks this report cluster.'
  ];

  const hypotheses = [
    `Players are missing key UI prompts or tutorials during early progression.`,
    `Current keybindings or inventory HUD elements may have poor visual affordance.`
  ];

  const suggestedFollowUpTest = `Replay the opening tutorial level with first-time testers in the upcoming session. Explicitly observe whether players can open their inventory without facilitator hints within the first 3 minutes.`;

  const suggestedNextAction = issueStateResult.hasConfirmedIssue
    ? `Link the ${issueStateResult.unresolvedReportIds.length} unresolved report(s) to existing confirmed issue "${issueStateResult.confirmedIssues[0].title}".`
    : `Create a confirmed tracking issue for "${topic} Friction" and assign to gameplay programming.`;

  return {
    status: 'proposal_ready',
    investigationTitle: `Pre-Playtest Investigation: ${topic} [Build ${build.version}]`,
    scope: {
      studioId,
      buildId,
      buildVersion: build.version,
      topic
    },
    cluster: {
      topic,
      reportCount: feedbackResult.reports.length,
      reports: feedbackResult.reports.map(r => ({
        _id: r._id,
        title: r.title,
        description: r.description,
        stepsToReproduce: r.stepsToReproduce,
        similarityScore: r.similarityScore
      }))
    },
    metrics: {
      distinctAffectedSessions: sessionCountResult.distinctSessionCount,
      totalReports: feedbackResult.reports.length,
      clusterConfidenceScore: avgSimilarity,
      existingIssuesCount: issueStateResult.allLinkedIssues.length,
      hasConfirmedIssue: issueStateResult.hasConfirmedIssue
    },
    evidence: {
      knownFacts,
      hypotheses,
      missingReproductionDetails,
      suggestedFollowUpTest,
      suggestedNextAction
    },
    executionTrace,
    totalExecutionMs: Date.now() - startTime,
    requiresDeveloperApproval: true,
    approvalPolicy: 'The agent provides recommendations only. Human developers retain exclusive authority to confirm issues or modify issue states.'
  };
};
