import mongoose from 'mongoose';

const taskHistorySchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true,
      index: true,
    },
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    fromStatus: String,
    toStatus: String,
    note: String,
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: [Number],
    },
  },
  {
    timestamps: true,
  }
);

export const TaskHistory = mongoose.model('TaskHistory', taskHistorySchema);
