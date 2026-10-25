import { Studio } from '../models/Studio.js';
import { StudioMembership } from '../models/StudioMembership.js';

export const createStudio = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Studio name is required.' });
    }

    const studio = await Studio.create({
      name: name.trim(),
      description: description || '',
      ownerId: req.user._id
    });

    // Automatically make creator the Studio Lead Developer & Owner
    await StudioMembership.create({
      userId: req.user._id,
      studioId: studio._id,
      role: 'developer',
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Studio created successfully.',
      studio
    });
  } catch (error) {
    next(error);
  }
};

export const getMyStudios = async (req, res, next) => {
  try {
    const memberships = await StudioMembership.find({
      userId: req.user._id,
      status: 'active'
    }).populate('studioId');

    const studios = memberships
      .filter(m => m.studioId) // filter out if studio was deleted
      .map(m => ({
        ...m.studioId.toObject(),
        myRole: m.role
      }));

    res.status(200).json({
      success: true,
      studios
    });
  } catch (error) {
    next(error);
  }
};

export const getStudioById = async (req, res, next) => {
  try {
    const studio = await Studio.findById(req.params.studioId);
    if (!studio) {
      return res.status(404).json({ success: false, message: 'Studio not found.' });
    }

    res.status(200).json({
      success: true,
      studio: {
        ...studio.toObject(),
        myRole: req.membership.role
      }
    });
  } catch (error) {
    next(error);
  }
};
