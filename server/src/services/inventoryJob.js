import cron from 'node-cron';
import { Resource } from '../models/Resource.js';
import { createNotification } from './notificationService.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const startInventoryJob = () => {
  logger.info(`Starting inventory cron job with schedule: ${ENV.INVENTORY_CRON_SCHEDULE}`);

  cron.schedule(ENV.INVENTORY_CRON_SCHEDULE, async () => {
    try {
      logger.info('Running scheduled inventory stock & expiry check...');
      const now = new Date();
      const expiringSoonDate = new Date();
      expiringSoonDate.setDate(now.getDate() + ENV.EXPIRING_SOON_DAYS);

      const resources = await Resource.find();

      for (const res of resources) {
        let newStatus = 'Available';
        const lowStockLimit = (res.initialQuantity * ENV.LOW_STOCK_THRESHOLD_PERCENT) / 100;

        if (res.expiryDate && new Date(res.expiryDate) < now) {
          newStatus = 'Expired';
        } else if (res.expiryDate && new Date(res.expiryDate) <= expiringSoonDate) {
          newStatus = 'Expiring Soon';
        } else if (res.quantity <= lowStockLimit || res.quantity === 0) {
          newStatus = 'Low Stock';
        }

        if (newStatus !== res.alertStatus) {
          const oldStatus = res.alertStatus;
          res.alertStatus = newStatus;
          await res.save();

          logger.warn(`Resource [${res.name}] status changed from ${oldStatus} to ${newStatus}`);

          // Send notification to resource provider and NGOs
          if (newStatus === 'Low Stock' || newStatus === 'Expiring Soon' || newStatus === 'Expired') {
            await createNotification({
              recipient: res.providerId,
              targetRole: 'ngo',
              title: `Resource Alert: ${res.name} is ${newStatus}`,
              message: `Resource "${res.name}" in category ${res.category} has changed status to ${newStatus}. Current stock: ${res.quantity} ${res.unit}.`,
              type: 'inventory',
              priority: newStatus === 'Expired' ? 'critical' : 'high',
              link: '/ngo/resources',
              metadata: { resourceId: res._id, alertStatus: newStatus },
            });
          }
        }
      }
    } catch (error) {
      logger.error(`Inventory cron job error: ${error.message}`);
    }
  });
};
