import { Notification } from '../models/Notification.js';
import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export const createNotification = async ({
  recipient,
  targetRole,
  title,
  message,
  type = 'system',
  priority = 'normal',
  link = '',
  metadata = {},
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      targetRole,
      title,
      message,
      type,
      priority,
      link,
      metadata,
    });

    const io = getIO();
    if (io) {
      if (recipient) {
        io.to(`user:${recipient.toString()}`).emit('notification:new', notification);
      }
      if (targetRole && targetRole !== 'all') {
        io.to(`role:${targetRole}`).emit('notification:new', notification);
      } else if (targetRole === 'all') {
        io.emit('notification:new', notification);
      }
    }

    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${error.message}`);
    return null;
  }
};
