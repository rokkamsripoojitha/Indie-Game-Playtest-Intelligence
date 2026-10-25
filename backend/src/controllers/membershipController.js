import crypto from 'crypto';
import { StudioMembership } from '../models/StudioMembership.js';
import { Studio } from '../models/Studio.js';
import { Invitation } from '../models/Invitation.js';
import { User } from '../models/User.js';
import { sendInvitationEmail } from '../services/emailService.js';
import { hashToken } from '../services/authService.js';

export const listMembers = async (req, res, next) => {
  try {
    const members = await StudioMembership.find({ studioId: req.studioId })
      .populate('userId', 'name email isVerified createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      members: members.map(m => ({
        membershipId: m._id,
        user: m.userId ? m.userId.toSafeObject() : null,
        role: m.role,
        status: m.status,
        joinedAt: m.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req, res, next) => {
  try {
    const { membershipId } = req.params;
    const { role } = req.body;

    if (!['tester', 'developer', 'studio_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const membership = await StudioMembership.findOne({
      _id: membershipId,
      studioId: req.studioId
    });

    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership record not found.' });
    }

    membership.role = role;
    await membership.save();

    res.status(200).json({
      success: true,
      message: `Role updated to ${role}.`,
      membership
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { membershipId } = req.params;
    const membership = await StudioMembership.findOne({
      _id: membershipId,
      studioId: req.studioId
    });

    if (!membership) {
      return res.status(404).json({ success: false, message: 'Membership record not found.' });
    }

    // Protect studio owner from accidental self-removal
    const studio = await Studio.findById(req.studioId);
    if (studio && studio.ownerId.toString() === membership.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the studio owner from memberships.'
      });
    }

    await membership.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Member removed from studio.'
    });
  } catch (error) {
    next(error);
  }
};

export const createInvitation = async (req, res, next) => {
  try {
    const { email, role = 'developer', invitationType = 'studio', sessionId = null } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Invitee email is required.' });
    }

    if (!['tester', 'developer', 'studio_admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }

    const studio = await Studio.findById(req.studioId);
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      tokenHash,
      invitationType,
      intendedRole: role,
      studioId: req.studioId,
      sessionId: sessionId || null,
      email: email.toLowerCase().trim(),
      expiresAt,
      issuedBy: req.user._id
    });

    const emailResult = await sendInvitationEmail(
      email,
      rawToken,
      studio.name,
      role,
      invitationType
    );

    res.status(201).json({
      success: true,
      message: `Invitation issued for ${email} as ${role}.`,
      invitationId: invitation._id,
      previewUrl: emailResult.previewUrl,
      rawToken: process.env.NODE_ENV !== 'production' ? rawToken : undefined
    });
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invitation token is required.' });
    }

    const tokenHash = hashToken(token);
    const invitation = await Invitation.findOne({
      tokenHash,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invitation is invalid, expired, or has already been used.'
      });
    }

    // Verify authenticated user's email matches the invitation target
    if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: `This invitation was issued to ${invitation.email}. You are currently logged in as ${req.user.email}.`
      });
    }

    // Upsert membership
    let membership = await StudioMembership.findOne({
      userId: req.user._id,
      studioId: invitation.studioId
    });

    if (membership) {
      membership.role = invitation.intendedRole;
      membership.status = 'active';
      await membership.save();
    } else {
      membership = await StudioMembership.create({
        userId: req.user._id,
        studioId: invitation.studioId,
        role: invitation.intendedRole,
        status: 'active'
      });
    }

    // Mark invitation as used (single-use constraint)
    invitation.isUsed = true;
    invitation.usedBy = req.user._id;
    invitation.usedAt = new Date();
    await invitation.save();

    res.status(200).json({
      success: true,
      message: `Successfully joined studio with role: ${invitation.intendedRole}.`,
      studioId: invitation.studioId,
      role: invitation.intendedRole
    });
  } catch (error) {
    next(error);
  }
};
