import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    invitationType: {
      type: String,
      enum: ['studio', 'session'],
      required: true
    },
    intendedRole: {
      type: String,
      enum: ['tester', 'developer', 'studio_admin'],
      required: true
    },
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: true
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlaytestSession',
      default: null
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    usedAt: {
      type: Date,
      default: null
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

invitationSchema.index({ studioId: 1, email: 1 });

export const Invitation = mongoose.model('Invitation', invitationSchema);
