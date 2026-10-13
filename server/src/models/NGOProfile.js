import mongoose from 'mongoose';

const ngoProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      default: '',
    },
    operatingSectors: {
      type: [String],
      default: ['Food & Water', 'Medical Aid', 'Rescue', 'Shelter Support'],
    },
    coverageRadiusKm: {
      type: Number,
      default: 50,
    },
    website: {
      type: String,
      default: '',
    },
    verificationDocuments: [
      {
        url: String,
        name: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const NGOProfile = mongoose.model('NGOProfile', ngoProfileSchema);
