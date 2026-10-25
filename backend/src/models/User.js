import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationTokenHash: {
      type: String,
      default: null
    },
    verificationTokenExpires: {
      type: Date,
      default: null
    },
    resetPasswordTokenHash: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    // Global default role is always 'tester'. Privileged roles are granted per studio via StudioMembership.
    systemRole: {
      type: String,
      enum: ['tester', 'admin'],
      default: 'tester'
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash passwords
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

// Sanitize user object for responses (removes hashes & tokens)
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.verificationTokenHash;
  delete obj.verificationTokenExpires;
  delete obj.resetPasswordTokenHash;
  delete obj.resetPasswordExpires;
  return obj;
};

export const User = mongoose.model('User', userSchema);
