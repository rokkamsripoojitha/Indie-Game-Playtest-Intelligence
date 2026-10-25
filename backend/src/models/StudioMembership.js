import mongoose from 'mongoose';

const studioMembershipSchema = new mongoose.Schema(
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
    role: {
      type: String,
      enum: ['tester', 'developer', 'studio_admin'],
      required: true,
      default: 'tester'
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'suspended'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// One active role per user per studio
studioMembershipSchema.index({ userId: 1, studioId: 1 }, { unique: true });
studioMembershipSchema.index({ studioId: 1, role: 1 });

export const StudioMembership = mongoose.model('StudioMembership', studioMembershipSchema);
