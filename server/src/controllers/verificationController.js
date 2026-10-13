import { VerificationDocument } from '../models/VerificationDocument.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../config/socket.js';

// POST /verification/submit
export const submitVerification = async (req, res, next) => {
  try {
    const { documentType = 'identity_card' } = req.body;

    if (!req.file) {
      return sendError(res, 'Verification document file is required.', 400);
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const doc = await VerificationDocument.create({
      userId: req.user._id,
      documentType,
      fileUrl,
      originalName: req.file.originalname,
      status: 'pending',
    });

    await User.findByIdAndUpdate(req.user._id, { verificationStatus: 'in_review' });

    // Notify admin
    await createNotification({
      targetRole: 'admin',
      title: 'Verification Document Submitted',
      message: `${req.user.name} (${req.user.role.toUpperCase()}) submitted document for review.`,
      type: 'verification',
      priority: 'normal',
      link: '/admin?tab=verifications',
    });

    return sendSuccess(res, doc, 'Verification document submitted for admin review.', 201);
  } catch (error) {
    next(error);
  }
};

// GET /admin/verifications
export const getVerificationQueue = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const documents = await VerificationDocument.find(query)
      .populate('userId', 'name email phone role verificationStatus address createdAt')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    const pendingUsers = await User.find({
      verificationStatus: { $in: ['pending', 'in_review'] },
      role: { $nin: ['survivor', 'admin'] },
    }).sort({ createdAt: -1 });

    return sendSuccess(res, { documents, pendingUsers }, 'Verification queue retrieved');
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/verifications/:id (or user id)
export const reviewVerification = async (req, res, next) => {
  try {
    const { status, rejectionReason = '', documentId } = req.body;
    const targetUserId = req.params.id;

    if (!['verified', 'rejected', 'in_review'].includes(status)) {
      return sendError(res, 'Invalid status. Must be "verified", "rejected", or "in_review".', 400);
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    user.verificationStatus = status;
    if (status === 'rejected') {
      user.rejectionReason = rejectionReason || 'Information provided did not meet verification criteria.';
    } else {
      user.rejectionReason = '';
    }
    await user.save();

    if (documentId) {
      await VerificationDocument.findByIdAndUpdate(documentId, {
        status: status === 'verified' ? 'approved' : status,
        reviewedBy: req.user._id,
        reviewNotes: rejectionReason,
        reviewedAt: new Date(),
      });
    }

    // Notify user
    await createNotification({
      recipient: user._id,
      title: status === 'verified' ? 'Account Verified!' : 'Verification Update',
      message:
        status === 'verified'
          ? 'Congratulations! Your responder account has been approved and verified by Admin.'
          : `Verification status updated: ${status}. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`,
      type: 'verification',
      priority: status === 'verified' ? 'high' : 'normal',
      link: `/${user.role}`,
    });

    const io = getIO();
    if (io) {
      io.to(`user:${user._id}`).emit('user:verification_updated', {
        status,
        rejectionReason,
      });
    }

    return sendSuccess(res, user, `User verification status set to ${status}`);
  } catch (error) {
    next(error);
  }
};
