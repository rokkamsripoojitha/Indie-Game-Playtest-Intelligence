import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BuildDocument'
    },
    title: { type: String, default: '' },
    buildVersion: { type: String, default: '' },
    chunkIndex: { type: Number, default: 0 },
    excerpt: { type: String, default: '' }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    citations: [citationSchema],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: true
    },
    buildId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Build',
      default: null
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlaytestSession',
      default: null
    },
    title: {
      type: String,
      default: 'New Conversation'
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

conversationSchema.index({ userId: 1, studioId: 1, buildId: 1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
