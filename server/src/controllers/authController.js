import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { VolunteerProfile } from '../models/VolunteerProfile.js';
import { NGOProfile } from '../models/NGOProfile.js';
import { Shelter } from '../models/Shelter.js';
import { ENV } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';

const generateTokens = (user) => {
  const payload = { id: user._id, role: user.role, email: user.email };
  const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN,
  });
  const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN,
  });
  return { accessToken, refreshToken };
};

// POST /auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role = 'survivor', location, address, profileData } = req.body;

    if (!name || !email || !phone || !password) {
      return sendError(res, 'Name, email, phone, and password are required.', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists.', 409);
    }

    const coordinates = location?.coordinates || [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT];

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role,
      location: {
        type: 'Point',
        coordinates,
      },
      address: address || '',
    });

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    // Create role-specific profile document
    if (role === 'volunteer') {
      await VolunteerProfile.create({
        userId: user._id,
        skills: profileData?.skills || ['First Aid'],
        serviceRadiusKm: profileData?.serviceRadiusKm || 25,
      });
    } else if (role === 'ngo') {
      await NGOProfile.create({
        userId: user._id,
        organizationName: profileData?.organizationName || name,
        registrationNumber: profileData?.registrationNumber || 'PENDING-' + Date.now(),
        operatingSectors: profileData?.operatingSectors || ['Food & Water', 'Medical Aid'],
      });
    } else if (role === 'shelter') {
      await Shelter.create({
        managerId: user._id,
        shelterName: profileData?.shelterName || `${name}'s Relief Shelter`,
        location: { type: 'Point', coordinates },
        address: address || 'Mumbai Central',
        totalCapacity: profileData?.totalCapacity || 100,
        currentOccupancy: 0,
        contactPhone: phone,
        facilities: profileData?.facilities || ['Food', 'Water', 'Washrooms', 'Electricity'],
      });
    }

    // If responder registered, notify admin queue
    if (role !== 'survivor' && role !== 'admin') {
      await createNotification({
        targetRole: 'admin',
        title: 'New Verification Request',
        message: `${name} registered as a ${role.toUpperCase()} and is awaiting verification.`,
        type: 'verification',
        priority: 'normal',
        link: '/admin?tab=verifications',
        metadata: { userId: user._id, role },
      });
    }

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return sendSuccess(res, { user: userObj, accessToken, refreshToken }, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
};

// POST /auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (user.isBlocked) {
      return sendError(res, 'Account suspended by administrator.', 403);
    }

    if (user.isLocked()) {
      return sendError(
        res,
        `Account temporarily locked due to repeated failed attempts. Please try again after ${new Date(
          user.lockUntil
        ).toLocaleTimeString()}`,
        429
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= ENV.ACCOUNT_LOCK_MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + ENV.ACCOUNT_LOCK_MINUTES * 60 * 1000);
      }
      await user.save();
      return sendError(res, 'Invalid email or password.', 401);
    }

    // Reset failed login counter on success
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    // Fetch extra role profile info if applicable
    let profile = null;
    if (user.role === 'volunteer') {
      profile = await VolunteerProfile.findOne({ userId: user._id });
    } else if (user.role === 'ngo') {
      profile = await NGOProfile.findOne({ userId: user._id });
    } else if (user.role === 'shelter') {
      profile = await Shelter.findOne({ managerId: user._id });
    }

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    return sendSuccess(
      res,
      { user: userObj, profile, accessToken, refreshToken },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

// POST /auth/refresh
export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendError(res, 'Refresh token is required.', 400);
    }

    const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, 'Invalid refresh token.', 401);
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return sendSuccess(res, tokens, 'Token refreshed successfully');
  } catch (error) {
    return sendError(res, 'Invalid or expired refresh token', 401);
  }
};

// GET /auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'volunteer') {
      profile = await VolunteerProfile.findOne({ userId: user._id });
    } else if (user.role === 'ngo') {
      profile = await NGOProfile.findOne({ userId: user._id });
    } else if (user.role === 'shelter') {
      profile = await Shelter.findOne({ managerId: user._id });
    }

    return sendSuccess(res, { user, profile }, 'Profile retrieved');
  } catch (error) {
    next(error);
  }
};

// PATCH /auth/location
export const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng, address } = req.body;
    if (lat == null || lng == null) {
      return sendError(res, 'Latitude and longitude are required.', 400);
    }

    const user = await User.findById(req.user._id);
    user.location = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };
    if (address) user.address = address;
    await user.save();

    return sendSuccess(res, { location: user.location, address: user.address }, 'Location updated');
  } catch (error) {
    next(error);
  }
};

// POST /auth/logout
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
    }
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// POST /auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Email address is required.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return ambiguous message for security
      return sendSuccess(res, null, 'If that account exists, a password reset link has been dispatched.');
    }

    const resetToken = jwt.sign({ id: user._id, type: 'pwd_reset' }, ENV.JWT_ACCESS_SECRET, {
      expiresIn: '1h',
    });

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${ENV.CLIENT_URL}/reset-password/${resetToken}`;

    return sendSuccess(
      res,
      { resetToken, resetUrl },
      'Password reset link generated successfully.'
    );
  } catch (error) {
    next(error);
  }
};

// POST /auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return sendError(res, 'Reset token and new password are required.', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters.', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_ACCESS_SECRET);
    } catch (err) {
      return sendError(res, 'Password reset token is invalid or has expired.', 400);
    }

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password +resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return sendError(res, 'Password reset token is invalid or has expired.', 400);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return sendSuccess(res, null, 'Password has been reset successfully. You can now log in.');
  } catch (error) {
    next(error);
  }
};

