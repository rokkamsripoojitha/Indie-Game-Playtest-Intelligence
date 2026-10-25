import { registerUser, verifyEmail, loginUser, requestPasswordReset, resetPassword } from '../services/authService.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await registerUser({ name, email, password });
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const verify = async (req, res, next) => {
  try {
    const { email, token } = req.body;
    const user = await verifyEmail({ email, token });
    res.status(200).json({
      success: true,
      message: 'Email successfully verified. You may now log in.',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser({ email, password, req });
    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  });
};

export const getMe = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toSafeObject()
  });
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await requestPasswordReset({ email });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const handleResetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    const result = await resetPassword({ email, token, newPassword });
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getCsrfToken = (req, res) => {
  res.status(200).json({
    success: true,
    csrfToken: req.session?.csrfToken || null
  });
};
