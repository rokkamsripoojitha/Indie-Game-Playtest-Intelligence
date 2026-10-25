import mongoose from 'mongoose';

const buildSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: true
    },
    buildName: {
      type: String,
      required: [true, 'Build name is required'],
      trim: true
    },
    version: {
      type: String,
      required: [true, 'Version string is required (e.g., v1.0.1)'],
      trim: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active'
    },
    releaseNotes: {
      type: String,
      default: ''
    },
    metadata: {
      engine: { type: String, default: 'Unity' },
      targetPlatform: { type: String, default: 'PC / Windows' },
      branch: { type: String, default: 'main' }
    }
  },
  {
    timestamps: true
  }
);

buildSchema.index({ studioId: 1, version: 1 }, { unique: true });

export const Build = mongoose.model('Build', buildSchema);
