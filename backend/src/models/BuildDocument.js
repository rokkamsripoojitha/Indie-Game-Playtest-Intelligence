import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    chunkIndex: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number],
      default: undefined
    }
  },
  { _id: true }
);

const buildDocumentSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: true
    },
    buildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Build',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true
    },
    sourceType: {
      type: String,
      enum: ['guide', 'troubleshooting', 'known_issues', 'patch_notes'],
      default: 'guide'
    },
    originalFilename: {
      type: String,
      default: ''
    },
    chunks: [chunkSchema],
    embeddingModel: {
      type: String,
      default: null
    },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

buildDocumentSchema.index({ studioId: 1, buildId: 1 });

export const BuildDocument = mongoose.model('BuildDocument', buildDocumentSchema);
