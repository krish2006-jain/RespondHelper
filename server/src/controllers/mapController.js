import { Request } from '../models/Request.js';
import { Shelter } from '../models/Shelter.js';
import { Resource } from '../models/Resource.js';
import { User } from '../models/User.js';
import { VolunteerProfile } from '../models/VolunteerProfile.js';
import { NGOProfile } from '../models/NGOProfile.js';
import { calculateDistanceKm } from '../utils/geoUtils.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ENV } from '../config/env.js';

// GET /map/entities
export const getMapEntities = async (req, res, next) => {
  try {
    const {
      lat = ENV.MAP_DEFAULT_LAT,
      lng = ENV.MAP_DEFAULT_LNG,
      radiusKm = 50,
      types = 'requests,volunteers,ngos,shelters,resources',
      priority,
      category,
      status,
    } = req.query;

    const center = [parseFloat(lng), parseFloat(lat)];
    const selectedTypes = types.split(',').map((t) => t.trim().toLowerCase());
    const entities = {
      requests: [],
      volunteers: [],
      ngos: [],
      shelters: [],
      resources: [],
    };

    // 1. Requests
    if (selectedTypes.includes('requests') || selectedTypes.includes('all')) {
      const reqQuery = {};
      if (priority) reqQuery.priority = priority;
      if (category) reqQuery.category = category;
      if (status) {
        reqQuery.status = status;
      } else {
        // Default show non-resolved or recent
        reqQuery.status = { $in: ['Submitted', 'Verified', 'Assigned', 'In Progress', 'Delivered'] };
      }

      const requests = await Request.find(reqQuery).populate('survivorId', 'name phone address');
      entities.requests = requests
        .map((r) => {
          const distanceKm = calculateDistanceKm(center, r.location.coordinates);
          return {
            id: r._id,
            type: 'request',
            category: r.category,
            priority: r.priority,
            status: r.status,
            title: r.title,
            peopleAffected: r.peopleAffected,
            isSOS: r.isSOS,
            location: r.location.coordinates, // [lng, lat]
            address: r.address,
            description: r.description,
            distanceKm,
            createdAt: r.createdAt,
            assignedTo: r.assignedTo,
          };
        })
        .filter((r) => r.distanceKm <= Number(radiusKm));
    }

    // 2. Shelters
    if (selectedTypes.includes('shelters') || selectedTypes.includes('all')) {
      const shelters = await Shelter.find({ isActive: true }).populate('managerId', 'name phone');
      entities.shelters = shelters
        .map((s) => {
          const distanceKm = calculateDistanceKm(center, s.location.coordinates);
          return {
            id: s._id,
            type: 'shelter',
            name: s.shelterName,
            status: s.status,
            totalCapacity: s.totalCapacity,
            currentOccupancy: s.currentOccupancy,
            availableSpaces: s.totalCapacity - s.currentOccupancy,
            facilities: s.facilities,
            phone: s.contactPhone,
            location: s.location.coordinates,
            address: s.address,
            distanceKm,
          };
        })
        .filter((s) => s.distanceKm <= Number(radiusKm));
    }

    // 3. Resources
    if (selectedTypes.includes('resources') || selectedTypes.includes('all')) {
      const resources = await Resource.find({ alertStatus: { $ne: 'Expired' } }).populate('providerId', 'name phone');
      entities.resources = resources
        .map((resItem) => {
          const distanceKm = calculateDistanceKm(center, resItem.location.coordinates);
          return {
            id: resItem._id,
            type: 'resource',
            name: resItem.name,
            category: resItem.category,
            quantity: resItem.quantity,
            unit: resItem.unit,
            alertStatus: resItem.alertStatus,
            providerName: resItem.providerId?.name || 'Relief Provider',
            location: resItem.location.coordinates,
            address: resItem.address,
            distanceKm,
          };
        })
        .filter((resItem) => resItem.distanceKm <= Number(radiusKm));
    }

    // 4. Volunteers (Only verified & available)
    if (selectedTypes.includes('volunteers') || selectedTypes.includes('all')) {
      const volunteers = await VolunteerProfile.find({ isAvailable: true }).populate({
        path: 'userId',
        match: { verificationStatus: 'verified', isBlocked: false },
        select: 'name phone location address',
      });

      entities.volunteers = volunteers
        .filter((v) => v.userId != null)
        .map((v) => {
          const vCoords = v.userId.location?.coordinates || [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT];
          const distanceKm = calculateDistanceKm(center, vCoords);
          return {
            id: v._id,
            userId: v.userId._id,
            type: 'volunteer',
            name: v.userId.name,
            phone: v.userId.phone,
            skills: v.skills,
            activeTasks: v.activeTaskCount,
            serviceRadiusKm: v.serviceRadiusKm,
            location: vCoords,
            address: v.userId.address,
            distanceKm,
          };
        })
        .filter((v) => v.distanceKm <= Number(radiusKm));
    }

    // 5. NGOs (Verified)
    if (selectedTypes.includes('ngos') || selectedTypes.includes('all')) {
      const ngos = await NGOProfile.find().populate({
        path: 'userId',
        match: { verificationStatus: 'verified', isBlocked: false },
        select: 'name phone location address',
      });

      entities.ngos = ngos
        .filter((n) => n.userId != null)
        .map((n) => {
          const coords = n.userId.location?.coordinates || [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT];
          const distanceKm = calculateDistanceKm(center, coords);
          return {
            id: n._id,
            userId: n.userId._id,
            type: 'ngo',
            name: n.organizationName,
            sectors: n.operatingSectors,
            phone: n.userId.phone,
            location: coords,
            address: n.userId.address,
            distanceKm,
          };
        })
        .filter((n) => n.distanceKm <= Number(radiusKm));
    }

    return sendSuccess(res, entities, 'Map entities retrieved');
  } catch (error) {
    next(error);
  }
};
