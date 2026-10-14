import { Request } from '../models/Request.js';
import { User } from '../models/User.js';
import { VolunteerProfile } from '../models/VolunteerProfile.js';
import { TaskHistory } from '../models/TaskHistory.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';
import { findMatchingResources, findMatchingVolunteers, findMatchingShelters } from '../services/matchingEngine.js';
import { getIO } from '../config/socket.js';
import { ENV } from '../config/env.js';

// POST /requests (or SOS)
export const createRequest = async (req, res, next) => {
  try {
    const {
      title,
      category = 'Emergency Supplies',
      priority = 'High',
      peopleAffected = 1,
      location,
      address,
      description,
      isSOS = false,
      medicalNeeds = false,
      specialRequirements = '',
    } = req.body;

    const coordinates = location?.coordinates ||
      (req.user.location?.coordinates?.length === 2
        ? req.user.location.coordinates
        : [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT]);

    // Format uploaded media files
    const media = (req.files || []).map((file) => ({
      url: `/uploads/${file.filename}`,
      fileType: file.mimetype,
      name: file.originalname,
    }));

    const newRequest = await Request.create({
      survivorId: req.user._id,
      title: title || (isSOS ? `SOS: Urgent ${category} Assistance` : `${category} Emergency Help Request`),
      category,
      priority,
      peopleAffected: parseInt(peopleAffected, 10) || 1,
      location: {
        type: 'Point',
        coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])],
      },
      address: address || req.user.address || 'Location detected via GPS',
      description: description || (isSOS ? 'Immediate SOS assistance required!' : ''),
      media,
      status: 'Submitted',
      isSOS: Boolean(isSOS),
      medicalNeeds: Boolean(medicalNeeds),
      specialRequirements,
      statusHistory: [
        {
          status: 'Submitted',
          updatedBy: req.user._id,
          updatedByName: req.user.name,
          note: isSOS ? 'Emergency SOS initiated' : 'Request submitted by survivor',
          timestamp: new Date(),
        },
      ],
    });

    const populatedRequest = await Request.findById(newRequest._id).populate('survivorId', 'name phone email');

    // Real-time broadcast via Socket.io
    const io = getIO();
    if (io) {
      io.emit('request:created', populatedRequest);
      io.to('role:admin').emit('notification:new', {
        title: isSOS ? '🚨 CRITICAL SOS ALERT' : 'New Emergency Request',
        message: `${req.user.name} reported ${category} emergency (${priority} priority).`,
        priority: isSOS || priority === 'Critical' ? 'critical' : 'high',
        link: `/survivor/requests/${newRequest._id}`,
      });
      io.to('role:volunteer').emit('request:nearby_alert', populatedRequest);
    }

    // Create DB notifications for admin & nearby volunteers
    await createNotification({
      targetRole: 'admin',
      title: isSOS ? '🚨 CRITICAL SOS ALERT' : `Emergency Request: ${category}`,
      message: `${req.user.name} requested ${category} (${priority} priority) for ${peopleAffected} people.`,
      type: 'emergency',
      priority: isSOS || priority === 'Critical' ? 'critical' : 'high',
      link: `/admin?tab=requests`,
      metadata: { requestId: newRequest._id, priority, isSOS },
    });

    return sendSuccess(res, populatedRequest, isSOS ? 'SOS emergency broadcasted!' : 'Emergency request submitted successfully', 201);
  } catch (error) {
    next(error);
  }
};

// GET /requests
export const getRequests = async (req, res, next) => {
  try {
    const {
      status,
      priority,
      category,
      isSOS,
      assigned,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    // Survivors only see their own requests unless admin/responder
    if (req.user.role === 'survivor') {
      query.survivorId = req.user._id;
    }

    if (status) {
      query.status = status.includes(',') ? { $in: status.split(',').map((s) => s.trim()) } : status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (category) {
      query.category = category;
    }
    if (isSOS !== undefined) {
      query.isSOS = isSOS === 'true';
    }
    if (assigned === 'true') {
      query['assignedTo.responderId'] = { $exists: true, $ne: null };
    } else if (assigned === 'false') {
      query['assignedTo.responderId'] = null;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Request.countDocuments(query);
    const requests = await Request.find(query)
      .populate('survivorId', 'name phone email address')
      .populate('assignedTo.responderId', 'name phone email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return sendSuccess(res, {
      requests,
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

// GET /requests/:id
export const getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('survivorId', 'name phone email address')
      .populate('assignedTo.responderId', 'name phone email role');

    if (!request) {
      return sendError(res, 'Request not found.', 404);
    }

    // If survivor, ensure ownership
    if (req.user.role === 'survivor' && request.survivorId._id.toString() !== req.user._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    return sendSuccess(res, request, 'Request details retrieved');
  } catch (error) {
    next(error);
  }
};

// GET /requests/:id/matches
export const getRequestMatches = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return sendError(res, 'Request not found.', 404);
    }

    const resourceMatches = await findMatchingResources(request);
    const volunteerMatches = await findMatchingVolunteers(request);
    const shelterMatches = await findMatchingShelters(request);

    return sendSuccess(
      res,
      {
        request,
        recommendedResources: resourceMatches,
        recommendedVolunteers: volunteerMatches,
        recommendedShelters: shelterMatches,
      },
      'Matches calculated'
    );
  } catch (error) {
    next(error);
  }
};

// PATCH /requests/:id/status
export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, note = '' } = req.body;
    const validStatuses = [
      'Submitted',
      'Verified',
      'Assigned',
      'In Progress',
      'Delivered',
      'Resolved',
      'Cancelled',
      'Rejected',
    ];

    if (!validStatuses.includes(status)) {
      return sendError(res, `Invalid status. Must be one of: [${validStatuses.join(', ')}]`, 400);
    }

    const request = await Request.findById(req.params.id).populate('survivorId', 'name phone email');
    if (!request) {
      return sendError(res, 'Request not found.', 404);
    }

    const previousStatus = request.status;
    request.status = status;
    request.statusHistory.push({
      status,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: note || `Status updated from ${previousStatus} to ${status}`,
      timestamp: new Date(),
    });

    await request.save();

    // Log to TaskHistory
    await TaskHistory.create({
      requestId: request._id,
      responderId: req.user._id,
      action: `STATUS_CHANGE_${status.toUpperCase().replace(/\s+/g, '_')}`,
      fromStatus: previousStatus,
      toStatus: status,
      note,
    });

    // Real-time broadcast
    const io = getIO();
    if (io) {
      io.to(`request:${request._id}`).emit('request:status_changed', {
        requestId: request._id,
        status,
        updatedBy: req.user.name,
        timestamp: new Date(),
      });
      io.to(`user:${request.survivorId._id}`).emit('request:status_changed', {
        requestId: request._id,
        status,
        note,
      });
      io.emit('map:entity_updated', { type: 'request', entity: request });
    }

    // In-app notification to survivor
    await createNotification({
      recipient: request.survivorId._id,
      title: `Request ${status}`,
      message: `Your emergency request for ${request.category} is now marked as "${status}".`,
      type: 'status_update',
      priority: status === 'In Progress' || status === 'Delivered' || status === 'Resolved' ? 'high' : 'normal',
      link: `/survivor/requests/${request._id}`,
      metadata: { requestId: request._id, status },
    });

    return sendSuccess(res, request, `Request status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

// PATCH /requests/:id/cancel
export const cancelRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return sendError(res, 'Request not found.', 404);
    }

    if (
      req.user.role === 'survivor' &&
      request.survivorId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'You can only cancel your own requests.', 403);
    }

    if (request.status !== 'Submitted' && request.status !== 'Verified') {
      return sendError(
        res,
        `Cannot cancel request. It is already "${request.status}". Please contact your assigned responder or admin.`,
        400
      );
    }

    request.status = 'Cancelled';
    request.statusHistory.push({
      status: 'Cancelled',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: req.body.reason || 'Cancelled by requester',
      timestamp: new Date(),
    });

    await request.save();

    const io = getIO();
    if (io) {
      io.to(`request:${request._id}`).emit('request:status_changed', {
        requestId: request._id,
        status: 'Cancelled',
      });
    }

    return sendSuccess(res, request, 'Request has been cancelled.');
  } catch (error) {
    next(error);
  }
};
