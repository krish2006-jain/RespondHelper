import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

// GET /notifications
export const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly = false, limit = 50 } = req.query;

    const query = {
      $or: [
        { recipient: req.user._id },
        { targetRole: req.user.role },
        { targetRole: 'all' },
      ],
    };

    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    return sendSuccess(res, { notifications, unreadCount }, 'Notifications retrieved');
  } catch (error) {
    next(error);
  }
};

// PATCH /notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    return sendSuccess(res, notification, 'Marked as read');
  } catch (error) {
    next(error);
  }
};

// PATCH /notifications/read-all
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        $or: [
          { recipient: req.user._id },
          { targetRole: req.user.role },
          { targetRole: 'all' },
        ],
        isRead: false,
      },
      { isRead: true }
    );
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};
