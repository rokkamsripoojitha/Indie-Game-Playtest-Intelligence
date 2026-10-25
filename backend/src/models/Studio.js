import mongoose from 'mongoose';

const studioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Studio name is required'],
      trim: true,
      maxlength: [100, 'Studio name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

studioSchema.index({ ownerId: 1 });

export const Studio = mongoose.model('Studio', studioSchema);
