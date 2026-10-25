import mongoose from 'mongoose';

const reportLinkSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: true
    },
    sourceReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackReport',
      required: true
    },
    targetType: {
      type: String,
      enum: ['issue', 'report'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    relationshipType: {
      type: String,
      enum: ['duplicate', 'related', 'blocks'],
      default: 'duplicate'
    },
    similarityScore: {
      type: Number,
      default: null
    },
    decisionStatus: {
      type: String,
      enum: ['suggested', 'accepted', 'dismissed'],
      default: 'suggested'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decisionReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

reportLinkSchema.index({ studioId: 1, sourceReportId: 1, targetId: 1 });

export const ReportLink = mongoose.model('ReportLink', reportLinkSchema);
