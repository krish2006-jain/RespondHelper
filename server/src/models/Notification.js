import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    targetRole: {
      type: String,
      enum: ['survivor', 'volunteer', 'ngo', 'shelter', 'resource_provider', 'admin', 'all'],
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['emergency', 'assignment', 'status_update', 'verification', 'inventory', 'system'],
      default: 'system',
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'normal'],
      default: 'normal',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
