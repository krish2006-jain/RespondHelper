import { Shelter } from '../models/Shelter.js';
import { Request } from '../models/Request.js';
import { Assignment } from '../models/Assignment.js';
import { calculateDistanceKm } from '../utils/geoUtils.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';
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

// GET /shelters/assigned-requests (for Shelter Manager)
export const getAssignedRequests = async (req, res, next) => {
  try {
    const shelter = await Shelter.findOne({ managerId: req.user._id });

    // Requests assigned directly to this shelter manager
    const assignedRequests = await Request.find({
      'assignedTo.responderId': req.user._id,
    })
      .populate('survivorId', 'name phone email address')
      .sort({ updatedAt: -1 });

    // Open unassigned shelter requests (nearby / in open queue)
    const openShelterRequests = await Request.find({
      category: 'Shelter',
      status: { $in: ['Submitted', 'Verified'] },
      $or: [
        { 'assignedTo.responderId': null },
        { 'assignedTo.responderId': { $exists: false } },
      ],
    })
      .populate('survivorId', 'name phone email address')
      .sort({ createdAt: -1 })
      .limit(10);

    return sendSuccess(
      res,
      {
        shelter,
        assignedRequests,
        openShelterRequests,
      },
      'Shelter requests retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// POST /shelters/requests/:id/accept
export const acceptShelterRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id).populate('survivorId', 'name phone email');
    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    const shelter = await Shelter.findOne({ managerId: req.user._id });
    const shelterName = shelter ? shelter.shelterName : `${req.user.name}'s Shelter`;

    request.status = 'In Progress';
    if (!request.assignedTo) {
      request.assignedTo = {
        responderId: req.user._id,
        responderRole: 'shelter',
        responderName: req.user.name,
        responderPhone: req.user.phone,
        assignedAt: new Date(),
        taskStatus: 'Accepted',
      };
    } else {
      request.assignedTo.taskStatus = 'Accepted';
    }

    request.statusHistory.push({
      status: 'In Progress',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: `Shelter request accepted by Shelter Manager (${shelterName}). Preparing admission.`,
      timestamp: new Date(),
    });
    await request.save();

    await Assignment.findOneAndUpdate(
      { requestId: request._id },
      {
        responderId: req.user._id,
        responderRole: 'shelter',
        status: 'Accepted',
        startedAt: new Date(),
      },
      { upsert: true }
    );

    const survivorUserId = request.survivorId?._id || request.survivorId;
    if (survivorUserId) {
      await createNotification({
        recipient: survivorUserId,
        title: 'Shelter Accommodation Accepted!',
        message: `${shelterName} has accepted your shelter request. You can proceed to the shelter location: ${shelter?.address || req.user.address || 'Camp'}.`,
        type: 'assignment',
        priority: 'high',
        link: `/survivor/requests/${request._id}`,
      });
    }

    const io = getIO();
    if (io) {
      io.to(`request:${request._id}`).emit('request:status_changed', {
        requestId: request._id,
        status: 'In Progress',
        taskStatus: 'Accepted',
        responder: { name: req.user.name, phone: req.user.phone, role: 'shelter' },
      });
      if (survivorUserId) {
        io.to(`user:${survivorUserId}`).emit('request:status_changed', {
          requestId: request._id,
          status: 'In Progress',
          taskStatus: 'Accepted',
        });
      }
    }

    return sendSuccess(res, request, 'Shelter request accepted successfully');
  } catch (error) {
    next(error);
  }
};

// POST /shelters/requests/:id/allocate (Check-in & Allocate Bed)
export const allocateShelterBed = async (req, res, next) => {
  try {
    const { bedsAllocated } = req.body;
    const request = await Request.findById(req.params.id).populate('survivorId', 'name phone email');
    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    const shelter = await Shelter.findOne({ managerId: req.user._id });
    if (!shelter) {
      return sendError(res, 'No shelter registered for this manager', 404);
    }

    const bedsCount = Number(bedsAllocated) || request.peopleAffected || 1;
    shelter.currentOccupancy = Math.min(shelter.totalCapacity, shelter.currentOccupancy + bedsCount);
    await shelter.save();

    request.status = 'Resolved';
    if (!request.assignedTo) {
      request.assignedTo = {
        responderId: req.user._id,
        responderRole: 'shelter',
        responderName: req.user.name,
        responderPhone: req.user.phone,
        assignedAt: new Date(),
        taskStatus: 'Completed',
      };
    } else {
      request.assignedTo.taskStatus = 'Completed';
    }

    request.statusHistory.push({
      status: 'Resolved',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: `Admitted to ${shelter.shelterName}. Allocated ${bedsCount} bed(s). Occupancy updated to ${shelter.currentOccupancy}/${shelter.totalCapacity}.`,
      timestamp: new Date(),
    });
    await request.save();

    await Assignment.findOneAndUpdate(
      { requestId: request._id },
      {
        responderId: req.user._id,
        responderRole: 'shelter',
        status: 'Completed',
        completedAt: new Date(),
      },
      { upsert: true }
    );

    const survivorUserId = request.survivorId?._id || request.survivorId;
    if (survivorUserId) {
      await createNotification({
        recipient: survivorUserId,
        title: 'Safe Shelter Beds Allocated!',
        message: `You and your family (${bedsCount} evacuee(s)) are checked in at ${shelter.shelterName}. Address: ${shelter.address}.`,
        type: 'status_update',
        priority: 'high',
        link: `/survivor/requests/${request._id}`,
      });
    }

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
      io.to(`request:${request._id}`).emit('request:status_changed', {
        requestId: request._id,
        status: 'Resolved',
        taskStatus: 'Completed',
      });
      if (survivorUserId) {
        io.to(`user:${survivorUserId}`).emit('request:status_changed', {
          requestId: request._id,
          status: 'Resolved',
          taskStatus: 'Completed',
        });
      }
    }

    return sendSuccess(res, { request, shelter }, `Successfully admitted evacuee(s) and allocated ${bedsCount} bed(s)!`);
  } catch (error) {
    next(error);
  }
};

// POST /shelters/requests/:id/decline
export const declineShelterRequest = async (req, res, next) => {
  try {
    const { reason = 'Shelter at full capacity' } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    request.status = 'Submitted';
    request.assignedTo = undefined;
    request.statusHistory.push({
      status: 'Submitted',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: `Shelter manager declined request: ${reason}. Returned to dispatch queue.`,
      timestamp: new Date(),
    });
    await request.save();

    await Assignment.findOneAndUpdate(
      { requestId: request._id, responderId: req.user._id },
      { status: 'Declined', declineReason: reason }
    );

    // Notify Admins
    await createNotification({
      targetRole: 'admin',
      title: 'Shelter Request Declined by Manager',
      message: `${req.user.name} declined request "${request.title || request.category}" (${reason}). Needs reassignment.`,
      type: 'assignment',
      priority: 'high',
      link: '/admin?tab=requests',
    });

    const io = getIO();
    if (io) {
      io.emit('request:created', request);
      io.to(`request:${request._id}`).emit('request:status_changed', {
        requestId: request._id,
        status: 'Submitted',
        note: `Declined by shelter manager: ${reason}`,
      });
    }

    return sendSuccess(res, request, 'Shelter request declined and returned to dispatch queue');
  } catch (error) {
    next(error);
  }
};

