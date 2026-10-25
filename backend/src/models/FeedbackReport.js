import mongoose from 'mongoose';

const feedbackReportSchema = new mongoose.Schema(
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
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlaytestSession',
      required: true
    },
    testerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Feedback title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
      trim: true
    },
    stepsToReproduce: {
      type: String,
      default: ''
    },
    expectedBehavior: {
      type: String,
      default: ''
    },
    actualBehavior: {
      type: String,
      default: ''
    },
    attachments: [
      {
        filename: String,
        url: String,
        mimeType: String,
        sizeBytes: Number
      }
    ],
    // High-dimensional vector embedding of title + description + reproduction steps
    embedding: {
      type: [Number],
      default: undefined
    },
    embeddingModel: {
      type: String,
      default: null
    },
    embeddingDimension: {
      type: Number,
      default: null
    },
    embeddingStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    embeddingError: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['submitted', 'triaged', 'linked', 'resolved'],
      default: 'submitted'
    }
  },
  {
    timestamps: true
  }
);

feedbackReportSchema.index({ studioId: 1, buildId: 1, sessionId: 1 });
feedbackReportSchema.index({ testerId: 1 });

export const FeedbackReport = mongoose.model('FeedbackReport', feedbackReportSchema);
