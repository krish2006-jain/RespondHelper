import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    survivorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Food',
        'Water',
        'Medicine',
        'Shelter',
        'Rescue',
        'Transport',
        'Medical Assistance',
        'Clothing',
        'Emergency Supplies',
        'Other',
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'High',
      index: true,
    },
    peopleAffected: {
      type: Number,
      default: 1,
      min: 1,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    address: {
      type: String,
      default: 'Auto-detected Location',
    },
    description: {
      type: String,
      default: '',
    },
    media: [
      {
        url: String,
        fileType: String,
        name: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: [
        'Submitted',
        'Verified',
        'Assigned',
        'In Progress',
        'Delivered',
        'Resolved',
        'Cancelled',
        'Rejected',
      ],
      default: 'Submitted',
      index: true,
    },
    assignedTo: {
      responderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      responderRole: { type: String },
      responderName: { type: String },
      responderPhone: { type: String },
      assignedAt: { type: Date },
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedByName: { type: String },
        note: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    isSOS: {
      type: Boolean,
      default: false,
    },
    medicalNeeds: {
      type: Boolean,
      default: false,
    },
    specialRequirements: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

requestSchema.index({ location: '2dsphere' });
requestSchema.index({ createdAt: -1 });

export const Request = mongoose.model('Request', requestSchema);
