import crypto from 'crypto';
import { User } from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService.js';

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const registerUser = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await User.hashPassword(password);
  const rawVerificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenHash = hashToken(rawVerificationToken);
  const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Specification: "Public signup must never allow a user to choose Developer or Studio Admin. New public accounts receive the Tester role by default."
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    isVerified: false,
    verificationTokenHash,
    verificationTokenExpires,
    systemRole: 'tester'
  });

  // Attempt sending email
  const emailResult = await sendVerificationEmail(user.email, rawVerificationToken);

  return {
    user: user.toSafeObject(),
    devToken: process.env.NODE_ENV !== 'production' ? rawVerificationToken : undefined,
    previewUrl: emailResult.previewUrl
  };
};

export const verifyEmail = async ({ email, token }) => {
  if (!email || !token) {
    const error = new Error('Email and verification token are required.');
    error.statusCode = 400;
    throw error;
  }

  const hashed = hashToken(token);
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    verificationTokenHash: hashed,
    verificationTokenExpires: { $gt: new Date() }
  });

  if (!user) {
    const error = new Error('Verification token is invalid or has expired.');
    error.statusCode = 400;
    throw error;
  }

  user.isVerified = true;
  user.verificationTokenHash = null;
  user.verificationTokenExpires = null;
  await user.save();

  return user.toSafeObject();
};

export const loginUser = async ({ email, password, req }) => {
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Session rotation: regenerate session to prevent session fixation attacks
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user._id.toString();
      resolve(user.toSafeObject());
    });
  });
};

export const requestPasswordReset = async ({ email }) => {
  if (!email) {
    const error = new Error('Email is required.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Prevent user enumeration: respond identically whether email exists or not
  if (!user) {
    return {
      message: 'If that email address is registered, password reset instructions have been sent.'
    };
  }

  const rawResetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = hashToken(rawResetToken);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const emailResult = await sendPasswordResetEmail(user.email, rawResetToken);

  return {
    message: 'If that email address is registered, password reset instructions have been sent.',
    devToken: process.env.NODE_ENV !== 'production' ? rawResetToken : undefined,
    previewUrl: emailResult.previewUrl
  };
};

export const resetPassword = async ({ email, token, newPassword }) => {
  if (!email || !token || !newPassword) {
    const error = new Error('Email, reset token, and new password are required.');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const hashed = hashToken(token);
  const user = await User.findOne({
    email: email.toLowerCase().trim(),
    resetPasswordTokenHash: hashed,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    const error = new Error('Password reset token is invalid or has expired.');
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = await User.hashPassword(newPassword);
  // Expire and clear single-use token
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  return { message: 'Password has been successfully updated. You may now log in.' };
};
