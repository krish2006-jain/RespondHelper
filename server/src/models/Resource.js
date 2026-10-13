import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Food', 'Water', 'Medicine', 'Shelter', 'Rescue', 'Clothing', 'Emergency Supplies', 'Equipment', 'Other'],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    initialQuantity: {
      type: Number,
      default: function () {
        return this.quantity;
      },
    },
    unit: {
      type: String,
      enum: ['units', 'kg', 'litres', 'boxes', 'packets', 'bottles', 'meals', 'kits'],
      default: 'units',
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
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    alertStatus: {
      type: String,
      enum: ['Available', 'Low Stock', 'Expiring Soon', 'Expired'],
      default: 'Available',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    stockHistory: [
      {
        previousQuantity: Number,
        newQuantity: Number,
        change: Number,
        reason: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ location: '2dsphere' });

export const Resource = mongoose.model('Resource', resourceSchema);
