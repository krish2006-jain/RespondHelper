import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
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
      index: true,
    },
    responderRole: {
      type: String,
      enum: ['volunteer', 'ngo', 'shelter', 'resource_provider'],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
    },
    allocatedQuantity: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Assigned', 'Accepted', 'On the Way', 'Arrived', 'Assistance Provided', 'Completed', 'Declined', 'Cancelled'],
      default: 'Assigned',
      index: true,
    },
    declineReason: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      default: 0,
    },
    matchReason: {
      type: String,
      default: '',
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);
