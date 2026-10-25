import { config } from '../config/env.js';

export const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  if (!config.emailEnabled) {
    console.log(`[Email Service (Dev Simulation)] Verification link for ${email}: ${verificationUrl}`);
    return {
      sent: true,
      mode: 'simulated_dev',
      previewUrl: verificationUrl
    };
  }

  // If real email sending is enabled, configure transporter here.
  // We throw if sending fails so it never silently marks anything as verified.
  throw new Error('Real email service is enabled but SMTP provider credentials are not fully configured.');
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  if (!config.emailEnabled) {
    console.log(`[Email Service (Dev Simulation)] Password reset link for ${email}: ${resetUrl}`);
    return {
      sent: true,
      mode: 'simulated_dev',
      previewUrl: resetUrl
    };
  }

  throw new Error('Real email service is enabled but SMTP provider credentials are not fully configured.');
};

export const sendInvitationEmail = async (email, token, studioName, role, invitationType) => {
  const inviteUrl = `${config.frontendUrl}/join?token=${token}&email=${encodeURIComponent(email)}`;

  if (!config.emailEnabled) {
    console.log(`[Email Service (Dev Simulation)] Invitation link to ${studioName} as ${role} for ${email}: ${inviteUrl}`);
    return {
      sent: true,
      mode: 'simulated_dev',
      previewUrl: inviteUrl
    };
  }

  throw new Error('Real email service is enabled but SMTP provider credentials are not fully configured.');
};
