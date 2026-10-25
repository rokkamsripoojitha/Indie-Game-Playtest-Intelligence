import mongoose from 'mongoose';

const consentRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlaytestSession',
      default: null
    },
    consentType: {
      type: String,
      enum: ['feedback_collection', 'data_analysis', 'ai_processing'],
      required: true
    },
    consentStatus: {
      type: String,
      enum: ['granted', 'revoked'],
      default: 'granted'
    },
    consentVersion: {
      type: String,
      default: '1.0'
    },
    ipAddress: {
      type: String,
      default: ''
    },
    revocationReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

consentRecordSchema.index({ userId: 1, consentType: 1 });

export const ConsentRecord = mongoose.model('ConsentRecord', consentRecordSchema);
