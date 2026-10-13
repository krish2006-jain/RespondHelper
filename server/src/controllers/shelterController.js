import { Shelter } from '../models/Shelter.js';
import { calculateDistanceKm } from '../utils/geoUtils.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { getIO } from '../config/socket.js';
import { ENV } from '../config/env.js';

// GET /shelters
export const getShelters = async (req, res, next) => {
  try {
    const { status, facility, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (status) query.status = status;
    if (facility) query.facilities = { $in: [facility] };
    if (search) {
      query.$or = [
        { shelterName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Shelter.countDocuments(query);
    const shelters = await Shelter.find(query)
      .populate('managerId', 'name phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return sendSuccess(res, {
      shelters,
      pagination: {
        total,
        page: parseInt(page, 10),
        pages: Math.ceil(total / parseInt(limit, 10)) || 1,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /shelters/nearby
export const getNearbyShelters = async (req, res, next) => {
  try {
    const { lat, lng, radiusKm = 25 } = req.query;
    const centerLat = parseFloat(lat) || req.user?.location?.coordinates?.[1] || ENV.MAP_DEFAULT_LAT;
    const centerLng = parseFloat(lng) || req.user?.location?.coordinates?.[0] || ENV.MAP_DEFAULT_LNG;

    const shelters = await Shelter.find({
      isActive: true,
      status: { $ne: 'Closed' },
    }).populate('managerId', 'name phone email');

    const rankedShelters = shelters
      .map((shelter) => {
        const distanceKm = calculateDistanceKm([centerLng, centerLat], shelter.location.coordinates);
        return {
          shelter,
          distanceKm,
          availableSpaces: Math.max(0, shelter.totalCapacity - shelter.currentOccupancy),
        };
      })
      .filter((s) => s.distanceKm <= Number(radiusKm))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return sendSuccess(res, rankedShelters, 'Nearby shelters retrieved');
  } catch (error) {
    next(error);
  }
};

// GET /shelters/my-shelter (for Shelter manager role)
export const getMyShelter = async (req, res, next) => {
  try {
    let shelter = await Shelter.findOne({ managerId: req.user._id });
    if (!shelter && (req.user.role === 'shelter' || req.user.role === 'admin')) {
      // Auto-scaffold shelter for manager if none exists yet
      shelter = await Shelter.create({
        managerId: req.user._id,
        shelterName: `${req.user.name}'s Emergency Shelter`,
        location: req.user.location || { type: 'Point', coordinates: [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT] },
        address: req.user.address || 'Mumbai Central Relief Camp',
        totalCapacity: 150,
        currentOccupancy: 45,
        contactPhone: req.user.phone,
        facilities: ['Food', 'Water', 'Washrooms', 'Electricity', 'Bedding'],
      });
    }
    return sendSuccess(res, shelter, 'Shelter retrieved');
  } catch (error) {
    next(error);
  }
};

// POST /shelters
export const createShelter = async (req, res, next) => {
  try {
    const { shelterName, totalCapacity, location, address, facilities, contactPhone, notes } = req.body;

    if (!shelterName || !totalCapacity) {
      return sendError(res, 'Shelter name and total capacity are required.', 400);
    }

    const coordinates = location?.coordinates ||
      (req.user.location?.coordinates?.length === 2
        ? req.user.location.coordinates
        : [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT]);

    const shelter = await Shelter.create({
      managerId: req.user._id,
      shelterName,
      totalCapacity: Number(totalCapacity),
      currentOccupancy: 0,
      location: {
        type: 'Point',
        coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])],
      },
      address: address || req.user.address || 'Mumbai Relief Camp',
      facilities: facilities || ['Food', 'Water', 'Washrooms', 'Electricity'],
      contactPhone: contactPhone || req.user.phone,
      notes: notes || '',
    });

    const io = getIO();
    if (io) {
      io.emit('map:entity_created', { type: 'shelter', entity: shelter });
    }

    return sendSuccess(res, shelter, 'Shelter registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PATCH /shelters/:id/occupancy
export const updateOccupancy = async (req, res, next) => {
  try {
    const { delta, exactOccupancy } = req.body;
    const shelter = await Shelter.findById(req.params.id);

    if (!shelter) {
      return sendError(res, 'Shelter not found', 404);
    }

    if (
      req.user.role !== 'admin' &&
      shelter.managerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Unauthorized to update this shelter.', 403);
    }

    if (exactOccupancy !== undefined) {
      shelter.currentOccupancy = Math.max(0, Math.min(shelter.totalCapacity, Number(exactOccupancy)));
    } else if (delta !== undefined) {
      const newOcc = shelter.currentOccupancy + Number(delta);
      shelter.currentOccupancy = Math.max(0, Math.min(shelter.totalCapacity, newOcc));
    }

    await shelter.save();

    const io = getIO();
    if (io) {
      io.emit('shelter:occupancy_changed', {
        shelterId: shelter._id,
        currentOccupancy: shelter.currentOccupancy,
        totalCapacity: shelter.totalCapacity,
        status: shelter.status,
        availableSpaces: shelter.totalCapacity - shelter.currentOccupancy,
      });
      io.emit('map:entity_updated', { type: 'shelter', entity: shelter });
    }

    return sendSuccess(res, shelter, `Occupancy updated to ${shelter.currentOccupancy} / ${shelter.totalCapacity}`);
  } catch (error) {
    next(error);
  }
};

// PATCH /shelters/:id
export const updateShelter = async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return sendError(res, 'Shelter not found', 404);
    }

    if (
      req.user.role !== 'admin' &&
      shelter.managerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Unauthorized to edit this shelter.', 403);
    }

    const { shelterName, totalCapacity, address, facilities, contactPhone, notes, isActive, location } = req.body;

    if (shelterName) shelter.shelterName = shelterName;
    if (totalCapacity !== undefined) shelter.totalCapacity = Number(totalCapacity);
    if (address) shelter.address = address;
    if (facilities) shelter.facilities = facilities;
    if (contactPhone) shelter.contactPhone = contactPhone;
    if (notes !== undefined) shelter.notes = notes;
    if (isActive !== undefined) shelter.isActive = Boolean(isActive);
    if (location?.coordinates) {
      shelter.location = {
        type: 'Point',
        coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])],
      };
    }

    await shelter.save();
    return sendSuccess(res, shelter, 'Shelter updated successfully');
  } catch (error) {
    next(error);
  }
};

// GET /shelters/:id
export const getShelterById = async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id).populate('managerId', 'name phone email');
    if (!shelter) {
      return sendError(res, 'Shelter not found', 404);
    }
    return sendSuccess(res, shelter, 'Shelter retrieved');
  } catch (error) {
    next(error);
  }
};

// DELETE /shelters/:id
export const deleteShelter = async (req, res, next) => {
  try {
    const shelter = await Shelter.findById(req.params.id);
    if (!shelter) {
      return sendError(res, 'Shelter not found', 404);
    }

    if (
      req.user.role !== 'admin' &&
      shelter.managerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Unauthorized to delete this shelter.', 403);
    }

    shelter.isActive = false;
    await shelter.save();

    return sendSuccess(res, null, 'Shelter removed successfully');
  } catch (error) {
    next(error);
  }
};

