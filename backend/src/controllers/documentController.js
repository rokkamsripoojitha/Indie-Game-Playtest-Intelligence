import { BuildDocument } from '../models/BuildDocument.js';
import { Build } from '../models/Build.js';
import { indexBuildDocument } from '../services/ragService.js';

export const uploadDocument = async (req, res, next) => {
  try {
    const { buildId, title, sourceType = 'guide', content, originalFilename = '' } = req.body;

    if (!buildId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'buildId, title, and document text content are required.'
      });
    }

    const build = await Build.findOne({ _id: buildId, studioId: req.studioId });
    if (!build) {
      return res.status(404).json({ success: false, message: 'Build not found in this studio.' });
    }

    const doc = await indexBuildDocument({
      studioId: req.studioId,
      buildId,
      title: title.trim(),
      sourceType,
      content,
      originalFilename,
      uploadedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: `Document "${doc.title}" indexed successfully with ${doc.chunks.length} chunks.`,
      document: {
        _id: doc._id,
        title: doc.title,
        sourceType: doc.sourceType,
        chunkCount: doc.chunks.length,
        embeddingModel: doc.embeddingModel,
        embeddingStatus: doc.embeddingStatus,
        createdAt: doc.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const listDocuments = async (req, res, next) => {
  try {
    const { buildId } = req.query;
    const query = { studioId: req.studioId };
    if (buildId) query.buildId = buildId;

    const documents = await BuildDocument.find(query)
      .populate('buildId', 'version buildName')
      .populate('uploadedBy', 'name email')
      .select('-chunks.embedding')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const doc = await BuildDocument.findOne({
      _id: req.params.documentId,
      studioId: req.studioId
    })
      .populate('buildId', 'version buildName')
      .populate('uploadedBy', 'name email')
      .select('-chunks.embedding');

    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    res.status(200).json({
      success: true,
      document: doc
    });
  } catch (error) {
    next(error);
  }
};
