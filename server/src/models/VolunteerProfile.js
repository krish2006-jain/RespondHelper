import mongoose from 'mongoose';

const volunteerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    skills: {
      type: [String],
      default: ['First Aid'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    serviceRadiusKm: {
      type: Number,
      default: 25,
      min: 1,
      max: 150,
    },
    activeTaskCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    experienceYears: {
      type: Number,
      default: 1,
    },
    totalTasksCompleted: {
      type: Number,
      default: 0,
    },
    peopleHelpedCount: {
      type: Number,
      default: 0,
    },
    currentTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request',
      },
    ],
    idDocumentUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const VolunteerProfile = mongoose.model('VolunteerProfile', volunteerProfileSchema);
