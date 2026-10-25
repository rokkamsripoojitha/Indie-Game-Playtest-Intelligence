import crypto from 'crypto';
import { PlaytestSession } from '../models/PlaytestSession.js';
import { Build } from '../models/Build.js';

export const listSessions = async (req, res, next) => {
  try {
    const isDeveloperOrAdmin = ['developer', 'studio_admin'].includes(req.membership?.role);

    let query = { studioId: req.studioId };
    if (!isDeveloperOrAdmin) {
      // Tester can only see sessions where they are in permittedTesters
      query['permittedTesters.userId'] = req.user._id;
    }

    const sessions = await PlaytestSession.find(query)
      .populate('buildId', 'version buildName status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req, res, next) => {
  try {
    const { buildId, title, description, feedbackSharingPolicy = 'private', startDate, endDate } = req.body;

    if (!buildId || !title) {
      return res.status(400).json({
        success: false,
        message: 'buildId and session title are required.'
      });
    }

    const build = await Build.findOne({ _id: buildId, studioId: req.studioId });
    if (!build) {
      return res.status(404).json({ success: false, message: 'Build not found in this studio.' });
    }

    // Generate readable random access code, e.g. PLAY-7F2A
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const accessCode = `PLAY-${randomHex}`;

    const session = await PlaytestSession.create({
      studioId: req.studioId,
      buildId,
      title: title.trim(),
      description: description || '',
      feedbackSharingPolicy: feedbackSharingPolicy === 'shared' ? 'shared' : 'private',
      accessCode,
      startDate: startDate || new Date(),
      endDate: endDate || null
    });

    res.status(201).json({
      success: true,
      message: 'Playtest session created successfully.',
      session
    });
  } catch (error) {
    next(error);
  }
};

export const joinSessionWithCode = async (req, res, next) => {
  try {
    const { accessCode } = req.body;
    if (!accessCode) {
      return res.status(400).json({ success: false, message: 'Access code is required.' });
    }

    const session = await PlaytestSession.findOne({
      accessCode: accessCode.trim().toUpperCase()
    }).populate('buildId', 'version buildName');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Invalid playtest access code.' });
    }

    // Check if tester already joined
    const alreadyPermitted = session.permittedTesters.some(
      t => t.userId && t.userId.toString() === req.user._id.toString()
    );

    if (!alreadyPermitted) {
      session.permittedTesters.push({
        userId: req.user._id,
        email: req.user.email,
        joinedAt: new Date()
      });
      await session.save();
    }

    res.status(200).json({
      success: true,
      message: `Successfully joined playtest session: "${session.title}".`,
      session
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const session = await PlaytestSession.findOne({
      _id: req.params.sessionId,
      studioId: req.studioId
    }).populate('buildId', 'version buildName');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    res.status(200).json({
      success: true,
      session
    });
  } catch (error) {
    next(error);
  }
};
