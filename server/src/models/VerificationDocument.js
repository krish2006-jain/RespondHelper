import mongoose from 'mongoose';

const verificationDocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['identity_card', 'government_id', 'ngo_registration', 'medical_license', 'shelter_permit', 'other'],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNotes: {
      type: String,
      default: '',
    },
    reviewedAt: Date,
  },
  {
    timestamps: true,
  }
);

export const VerificationDocument = mongoose.model('VerificationDocument', verificationDocumentSchema);
