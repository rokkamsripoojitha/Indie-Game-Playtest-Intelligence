import { Conversation } from '../models/Conversation.js';
import { Build } from '../models/Build.js';
import { answerSetupQuestion } from '../services/ragService.js';

export const askSetupQuestion = async (req, res, next) => {
  try {
    const { buildId, sessionId = null, question, conversationId = null } = req.body;

    if (!buildId || !question) {
      return res.status(400).json({
        success: false,
        message: 'buildId and question are required.'
      });
    }

    const build = await Build.findOne({ _id: buildId, studioId: req.studioId });
    if (!build) {
      return res.status(404).json({ success: false, message: 'Build not found in this studio.' });
    }

    // Call RAG service strictly scoped to this build and studio
    const ragResult = await answerSetupQuestion({
      studioId: req.studioId,
      buildId,
      question: question.trim()
    });

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: req.user._id,
        studioId: req.studioId
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        userId: req.user._id,
        studioId: req.studioId,
        buildId,
        sessionId,
        title: question.length > 50 ? question.substring(0, 47) + '...' : question,
        messages: []
      });
    }

    // Append user question
    conversation.messages.push({
      role: 'user',
      content: question.trim(),
      timestamp: new Date()
    });

    // Append assistant grounded response with citations
    conversation.messages.push({
      role: 'assistant',
      content: ragResult.answer,
      citations: ragResult.citations,
      timestamp: new Date()
    });

    await conversation.save();

    res.status(200).json({
      success: true,
      answer: ragResult.answer,
      citations: ragResult.citations,
      grounded: ragResult.grounded,
      buildVersion: ragResult.buildVersion,
      conversationId: conversation._id
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationHistory = async (req, res, next) => {
  try {
    const { buildId } = req.query;
    const query = {
      userId: req.user._id,
      studioId: req.studioId
    };
    if (buildId) query.buildId = buildId;

    const conversations = await Conversation.find(query)
      .populate('buildId', 'version buildName')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      userId: req.user._id,
      studioId: req.studioId
    }).populate('buildId', 'version buildName');

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    res.status(200).json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
};
