import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema(
  {
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shelterName: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
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
    totalCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Available', 'Almost Full', 'Full', 'Closed'],
      default: 'Available',
      index: true,
    },
    facilities: {
      type: [String],
      enum: ['Food', 'Water', 'Medical', 'Washrooms', 'Electricity', 'Bedding', 'Accessibility', 'Pet-friendly'],
      default: ['Food', 'Water', 'Washrooms', 'Electricity', 'Bedding'],
    },
    contactPhone: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// GeoJSON 2dsphere index for nearby shelter discovery
shelterSchema.index({ location: '2dsphere' });

// Virtual field for available spaces
shelterSchema.virtual('availableSpaces').get(function () {
  return Math.max(0, this.totalCapacity - this.currentOccupancy);
});

// Auto compute status before save based on occupancy percentage
shelterSchema.pre('save', function (next) {
  if (this.currentOccupancy >= this.totalCapacity) {
    this.status = 'Full';
  } else if (this.currentOccupancy / this.totalCapacity >= 0.85) {
    this.status = 'Almost Full';
  } else {
    this.status = 'Available';
  }
  next();
});

export const Shelter = mongoose.model('Shelter', shelterSchema);
