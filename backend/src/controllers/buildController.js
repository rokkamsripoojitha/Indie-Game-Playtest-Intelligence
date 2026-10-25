import { Build } from '../models/Build.js';

export const listBuilds = async (req, res, next) => {
  try {
    const builds = await Build.find({ studioId: req.studioId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      builds
    });
  } catch (error) {
    next(error);
  }
};

export const createBuild = async (req, res, next) => {
  try {
    const { buildName, version, status = 'active', releaseNotes, metadata } = req.body;

    if (!buildName || !version) {
      return res.status(400).json({
        success: false,
        message: 'Build name and version string (e.g., v1.0.1) are required.'
      });
    }

    const existing = await Build.findOne({ studioId: req.studioId, version });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A build with version ${version} already exists in this studio.`
      });
    }

    const build = await Build.create({
      studioId: req.studioId,
      buildName: buildName.trim(),
      version: version.trim(),
      status,
      releaseNotes: releaseNotes || '',
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      message: 'Build created successfully.',
      build
    });
  } catch (error) {
    next(error);
  }
};

export const getBuildById = async (req, res, next) => {
  try {
    const build = await Build.findOne({
      _id: req.params.buildId,
      studioId: req.studioId
    });

    if (!build) {
      return res.status(404).json({ success: false, message: 'Build not found.' });
    }

    res.status(200).json({
      success: true,
      build
    });
  } catch (error) {
    next(error);
  }
};

export const updateBuild = async (req, res, next) => {
  try {
    const { buildName, status, releaseNotes, metadata } = req.body;
    const build = await Build.findOne({
      _id: req.params.buildId,
      studioId: req.studioId
    });

    if (!build) {
      return res.status(404).json({ success: false, message: 'Build not found.' });
    }

    if (buildName) build.buildName = buildName.trim();
    if (status) build.status = status;
    if (releaseNotes !== undefined) build.releaseNotes = releaseNotes;
    if (metadata) build.metadata = { ...build.metadata, ...metadata };

    await build.save();

    res.status(200).json({
      success: true,
      message: 'Build updated successfully.',
      build
    });
  } catch (error) {
    next(error);
  }
};
