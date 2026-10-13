import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { VolunteerProfile } from '../models/VolunteerProfile.js';
import { NGOProfile } from '../models/NGOProfile.js';
import { Shelter } from '../models/Shelter.js';
import { Resource } from '../models/Resource.js';
import { Request } from '../models/Request.js';
import { Assignment } from '../models/Assignment.js';
import { Notification } from '../models/Notification.js';
import { VerificationDocument } from '../models/VerificationDocument.js';
import { logger } from '../utils/logger.js';

const seedDatabase = async () => {
  try {
    logger.info('Connecting to MongoDB for seeding...');
    await mongoose.connect(ENV.MONGO_URI, { dbName: ENV.MONGO_DB_NAME });

    logger.info('Purging all existing data and mock records...');
    await Promise.all([
      User.deleteMany({}),
      VolunteerProfile.deleteMany({}),
      NGOProfile.deleteMany({}),
      Shelter.deleteMany({}),
      Resource.deleteMany({}),
      Request.deleteMany({}),
      Assignment.deleteMany({}),
      Notification.deleteMany({}),
      VerificationDocument.deleteMany({}),
    ]);

    const defaultPassword = 'Password@123';
    const adminPassword = 'Admin@12345';

    // 1. Admin
    logger.info('Creating 1/6: Admin (Command Center Admin)...');
    await User.create({
      name: 'Command Center Admin',
      email: 'admin@relief.org',
      phone: '+919876543210',
      password: adminPassword,
      role: 'admin',
      verificationStatus: 'verified',
      location: { type: 'Point', coordinates: [72.8777, 19.0760] },
      address: 'Disaster Management Authority, Mantralaya, Mumbai',
    });

    // 2. Survivor
    logger.info('Creating 2/6: Survivor (Aarav Sharma)...');
    await User.create({
      name: 'Aarav Sharma',
      email: 'survivor@relief.org',
      phone: '+919811122334',
      password: defaultPassword,
      role: 'survivor',
      verificationStatus: 'verified',
      location: { type: 'Point', coordinates: [72.8358, 19.0178] },
      address: 'Flat 402, Shanti Nivas, Dadar West, Mumbai',
    });

    // 3. Volunteer
    logger.info('Creating 3/6: Volunteer (Dr. Rahul Verma)...');
    const volunteerUser = await User.create({
      name: 'Dr. Rahul Verma',
      email: 'volunteer@relief.org',
      phone: '+919833344556',
      password: defaultPassword,
      role: 'volunteer',
      verificationStatus: 'verified',
      location: { type: 'Point', coordinates: [72.8425, 19.0222] },
      address: 'KEM Hospital Quarters, Parel, Mumbai',
    });
    await VolunteerProfile.create({
      userId: volunteerUser._id,
      skills: ['Medical Doctor', 'First Aid', 'Counseling'],
      isAvailable: true,
      serviceRadiusKm: 30,
      experienceYears: 6,
      totalTasksCompleted: 0,
      peopleHelpedCount: 0,
      activeTaskCount: 0,
    });

    // 4. NGO
    logger.info('Creating 4/6: NGO (Sewa Relief Foundation)...');
    const ngoUser = await User.create({
      name: 'Sewa Relief Foundation',
      email: 'ngo@relief.org',
      phone: '+919866677889',
      password: defaultPassword,
      role: 'ngo',
      verificationStatus: 'verified',
      location: { type: 'Point', coordinates: [72.8402, 19.0330] },
      address: 'Matunga Relief Hub, Plot 14, Mumbai',
    });
    await NGOProfile.create({
      userId: ngoUser._id,
      organizationName: 'Sewa Relief Foundation',
      registrationNumber: 'MAH-MUM-2018-NGO-8821',
      operatingSectors: ['Food & Water', 'Medical Aid', 'Rescue', 'Shelter Support'],
      coverageRadiusKm: 40,
    });

    // 5. Shelter Manager & Facility
    logger.info('Creating 5/6: Shelter (Shivaji Park Camp)...');
    const shelterManager = await User.create({
      name: 'Suresh Patil',
      email: 'shelter@relief.org',
      phone: '+919888899001',
      password: defaultPassword,
      role: 'shelter',
      verificationStatus: 'verified',
      location: { type: 'Point', coordinates: [72.8390, 19.0195] },
      address: 'Shivaji Park Community Center, Dadar, Mumbai',
    });
    await Shelter.create({
      managerId: shelterManager._id,
      shelterName: 'Shivaji Park Emergency Relief Camp',
      location: { type: 'Point', coordinates: [72.8390, 19.0195] },
      address: 'Shivaji Park Ground Hall, Dadar, Mumbai',
      totalCapacity: 500,
      currentOccupancy: 0,
      facilities: ['Food', 'Water', 'Medical', 'Washrooms', 'Electricity', 'Bedding', 'Accessibility'],
      contactPhone: '+919888899001',
      status: 'Available',
      notes: 'Ready for emergency occupancy.',
    });

    // 6. Resource Provider
    logger.info('Creating 6/6: Resource Provider (Apex Supplies)...');
    await User.create({
      name: 'Apex Supplies Depot',
      email: 'provider@relief.org',
      phone: '+919800011223',
      password: defaultPassword,
      role: 'resource_provider',
      verificationStatus: 'verified',
      location: { type: 'Point', coordinates: [72.8450, 19.0300] },
      address: 'Central Warehouse, Parel Industrial Zone, Mumbai',
    });

    logger.info('===========================================================');
    logger.info('✅ ALL MOCK DATA PURGED! EXACTLY 6 DEMO ACCOUNTS READY:');
    logger.info('-----------------------------------------------------------');
    logger.info('1. Admin:             admin@relief.org       / Admin@12345');
    logger.info('2. Survivor:          survivor@relief.org    / Password@123');
    logger.info('3. Volunteer:         volunteer@relief.org   / Password@123');
    logger.info('4. NGO:               ngo@relief.org         / Password@123');
    logger.info('5. Shelter:           shelter@relief.org     / Password@123');
    logger.info('6. Provider:          provider@relief.org    / Password@123');
    logger.info('===========================================================');

    process.exit(0);
  } catch (error) {
    logger.error(`Seeding error: ${error.message}`, error.stack);
    process.exit(1);
  }
};

seedDatabase();
