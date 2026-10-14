import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { VolunteerProfile } from '../models/VolunteerProfile.js';
import { NGOProfile } from '../models/NGOProfile.js';
import { Shelter } from '../models/Shelter.js';
import { Resource } from '../models/Resource.js';
import { Request } from '../models/Request.js';
import { logger } from '../utils/logger.js';

const demoAccounts = [
  {
    name: 'Command Center Admin',
    email: 'admin@relief.org',
    phone: '+919876543210',
    password: 'Admin@12345',
    role: 'admin',
    address: 'Disaster Management Authority, Mumbai',
  },
  {
    name: 'Aarav Sharma',
    email: 'survivor@relief.org',
    phone: '+919811122334',
    password: 'Password@123',
    role: 'survivor',
    address: 'Dadar West, Mumbai',
  },
  {
    name: 'Dr. Rahul Verma',
    email: 'volunteer@relief.org',
    phone: '+919833344556',
    password: 'Password@123',
    role: 'volunteer',
    address: 'Parel, Mumbai',
  },
  {
    name: 'Sewa Relief Foundation',
    email: 'ngo@relief.org',
    phone: '+919866677889',
    password: 'Password@123',
    role: 'ngo',
    address: 'Matunga, Mumbai',
  },
  {
    name: 'Suresh Patil',
    email: 'shelter@relief.org',
    phone: '+919888899001',
    password: 'Password@123',
    role: 'shelter',
    address: 'Dadar, Mumbai',
  },
  {
    name: 'Apex Supplies Depot',
    email: 'provider@relief.org',
    phone: '+919800011223',
    password: 'Password@123',
    role: 'resource_provider',
    address: 'Parel Industrial Zone, Mumbai',
  },
];

const seedDemoAccounts = async () => {
  try {
    await mongoose.connect(ENV.MONGO_URI, { dbName: ENV.MONGO_DB_NAME });

    for (const account of demoAccounts) {
      let user = await User.findOne({ email: account.email });
      if (user) {
        user.name = account.name;
        user.phone = account.phone;
        user.password = account.password;
        user.role = account.role;
        user.address = account.address;
        user.verificationStatus = 'verified';
        user.isBlocked = false;
      } else {
        user = new User({
          ...account,
          location: {
            type: 'Point',
            coordinates: [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT],
          },
          verificationStatus: 'verified',
        });
      }
      await user.save();

      if (account.role === 'volunteer') {
        await VolunteerProfile.findOneAndUpdate(
          { userId: user._id },
          { $setOnInsert: { userId: user._id, skills: ['First Aid'], serviceRadiusKm: 25 } },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }

      if (account.role === 'ngo') {
        await NGOProfile.findOneAndUpdate(
          { userId: user._id },
          {
            $setOnInsert: {
              userId: user._id,
              organizationName: account.name,
              registrationNumber: 'DEMO-NGO-001',
              operatingSectors: ['Food & Water', 'Medical Aid'],
            },
          },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }

      if (account.role === 'shelter') {
        await Shelter.findOneAndUpdate(
          { managerId: user._id },
          {
            $setOnInsert: {
              managerId: user._id,
              shelterName: 'Shivaji Park Emergency Relief Camp',
              location: { type: 'Point', coordinates: [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT] },
              address: account.address,
              totalCapacity: 500,
              currentOccupancy: 0,
              facilities: ['Food', 'Water', 'Medical', 'Washrooms'],
              contactPhone: account.phone,
              status: 'Available',
            },
          },
          { upsert: true, setDefaultsOnInsert: true }
        );
      }
    }

    logger.info('Six role demo accounts are verified, clean, and ready. No dummy requests or resources created.');
  } catch (error) {
    logger.error(`Demo account setup failed: ${error.message}`, error.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDemoAccounts();
