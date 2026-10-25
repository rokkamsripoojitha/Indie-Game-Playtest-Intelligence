import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: true
    },
    buildScope: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Build'
      }
    ],
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['unconfirmed', 'confirmed', 'in_progress', 'verified_fix', 'closed'],
      default: 'unconfirmed'
    },
    evidenceReportIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeedbackReport'
      }
    ],
    verificationDetails: {
      verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: { type: Date },
      notes: { type: String, default: '' }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

issueSchema.index({ studioId: 1, status: 1 });

export const Issue = mongoose.model('Issue', issueSchema);
