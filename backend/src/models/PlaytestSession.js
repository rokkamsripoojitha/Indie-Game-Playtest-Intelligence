import mongoose from 'mongoose';

const playtestSessionSchema = new mongoose.Schema(
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
      required: [true, 'Session title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    feedbackSharingPolicy: {
      type: String,
      enum: ['private', 'shared'],
      default: 'private',
      // 'private': Testers can only view their own feedback reports
      // 'shared': Testers in this session can see other testers' feedback within this session
    },
    accessCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    permittedTesters: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        email: { type: String, lowercase: true, trim: true },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

playtestSessionSchema.index({ studioId: 1, buildId: 1 });

export const PlaytestSession = mongoose.model('PlaytestSession', playtestSessionSchema);
