import { Request } from '../models/Request.js';
import { VolunteerProfile } from '../models/VolunteerProfile.js';
import { Assignment } from '../models/Assignment.js';
import { TaskHistory } from '../models/TaskHistory.js';
import { calculateDistanceKm } from '../utils/geoUtils.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../config/socket.js';
import { ENV } from '../config/env.js';

// GET /volunteers/nearby-requests
export const getNearbyRequests = async (req, res, next) => {
  try {
    const profile = await VolunteerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return sendError(res, 'Volunteer profile not found.', 404);
    }

    const volunteerCoords = req.user.location?.coordinates || [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT];
    const radiusKm = profile.serviceRadiusKm || ENV.MATCH_DEFAULT_RADIUS_KM;

    // Find pending/submitted/verified requests that are unassigned
    const requests = await Request.find({
      status: { $in: ['Submitted', 'Verified'] },
      'assignedTo.responderId': null,
    }).populate('survivorId', 'name phone address');

    // Score and filter each request relative to this volunteer
    const scoredRequests = requests
      .map((request) => {
        const distanceKm = calculateDistanceKm(volunteerCoords, request.location.coordinates);

        if (distanceKm > radiusKm) return null;

        const distanceScore = Math.max(0, 1 - distanceKm / radiusKm);

        // Check skill alignment
        const skillMatch = profile.skills.some((s) =>
          request.category.toLowerCase().includes(s.toLowerCase()) ||
          s.toLowerCase().includes(request.category.toLowerCase()) ||
          s === 'First Aid'
        );
        const skillScore = skillMatch ? 1.0 : 0.5;

        const priorityScore = {
          Critical: 1.0,
          High: 0.8,
          Medium: 0.5,
          Low: 0.3,
        }[request.priority] || 0.5;

        const totalScore =
          ENV.VOLUNTEER_WEIGHTS.distance * distanceScore +
          ENV.VOLUNTEER_WEIGHTS.skill * skillScore +
          ENV.VOLUNTEER_WEIGHTS.priority * priorityScore +
          0.2;

        let matchLabel = 'Possible';
        if (totalScore >= 0.75) matchLabel = 'Great';
        else if (totalScore >= 0.58) matchLabel = 'Good';

        return {
          request,
          distanceKm,
          score: Math.round(totalScore * 100) / 100,
          matchLabel,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);

    return sendSuccess(res, { requests: scoredRequests, profile }, 'Nearby requests retrieved');
  } catch (error) {
    next(error);
  }
};

// GET /volunteers/active-tasks
export const getActiveTasks = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({
      responderId: req.user._id,
      status: { $in: ['Assigned', 'Accepted', 'On the Way', 'Arrived', 'Assistance Provided'] },
    })
      .populate({
        path: 'requestId',
        populate: { path: 'survivorId', select: 'name phone email address' },
      })
      .sort({ createdAt: -1 });

    return sendSuccess(res, assignments, 'Active tasks retrieved');
  } catch (error) {
    next(error);
  }
};

// POST /volunteers/tasks/:id/accept
export const acceptTask = async (req, res, next) => {
  try {
    const profile = await VolunteerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return sendError(res, 'Volunteer profile not found', 404);
    }

    if (profile.activeTaskCount >= ENV.VOLUNTEER_MAX_ACTIVE_TASKS) {
      return sendError(
        res,
        `You have reached the maximum allowed concurrent active tasks (${ENV.VOLUNTEER_MAX_ACTIVE_TASKS}). Please complete or decline an existing task first.`,
        400
      );
    }

    const request = await Request.findById(req.params.id).populate('survivorId', 'name phone email');
    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    if (request.assignedTo?.responderId && request.assignedTo.responderId.toString() !== req.user._id.toString()) {
      return sendError(res, 'This request has already been assigned to another responder.', 400);
    }

    // Assign request
    request.status = 'Assigned';
    request.assignedTo = {
      responderId: req.user._id,
      responderRole: 'volunteer',
      responderName: req.user.name,
      responderPhone: req.user.phone,
      assignedAt: new Date(),
    };
    request.statusHistory.push({
      status: 'Assigned',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: `Task accepted by Volunteer ${req.user.name}`,
      timestamp: new Date(),
    });
    await request.save();

    // Create Assignment
    let assignment = await Assignment.findOne({
      requestId: request._id,
      responderId: req.user._id,
    });

    if (!assignment) {
      assignment = await Assignment.create({
        requestId: request._id,
        responderId: req.user._id,
        responderRole: 'volunteer',
        status: 'Accepted',
        startedAt: new Date(),
      });
    } else {
      assignment.status = 'Accepted';
      await assignment.save();
    }

    // Update volunteer profile count
    profile.activeTaskCount += 1;
    if (!profile.currentTasks.includes(request._id)) {
      profile.currentTasks.push(request._id);
    }
    await profile.save();

    // Notify survivor & log history
    await createNotification({
      recipient: request.survivorId._id,
      title: 'Volunteer Assigned!',
      message: `${req.user.name} has accepted your emergency request and is preparing assistance.`,
      type: 'assignment',
      priority: 'high',
      link: `/survivor/requests/${request._id}`,
      metadata: { volunteerName: req.user.name, phone: req.user.phone },
    });

    const io = getIO();
    if (io) {
      io.to(`request:${request._id}`).emit('request:status_changed', {
        requestId: request._id,
        status: 'Assigned',
        responder: { name: req.user.name, phone: req.user.phone },
      });
      io.to(`user:${request.survivorId._id}`).emit('request:status_changed', {
        requestId: request._id,
        status: 'Assigned',
        responder: { name: req.user.name, phone: req.user.phone },
      });
    }

    return sendSuccess(res, { request, assignment }, 'Task accepted successfully');
  } catch (error) {
    next(error);
  }
};

// PATCH /volunteers/tasks/:id/status
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, note = '' } = req.body;
    const validTaskStatuses = ['Accepted', 'On the Way', 'Arrived', 'Assistance Provided', 'Completed'];

    if (!validTaskStatuses.includes(status)) {
      return sendError(res, `Invalid task status. Allowed: [${validTaskStatuses.join(', ')}]`, 400);
    }

    const request = await Request.findById(req.params.id).populate('survivorId', 'name phone email');
    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    const assignment = await Assignment.findOne({
      requestId: request._id,
      responderId: req.user._id,
    });

    if (assignment) {
      assignment.status = status;
      if (status === 'Completed') {
        assignment.completedAt = new Date();
      }
      await assignment.save();
    }

    // Map task status to request lifecycle status
    let reqStatus = 'In Progress';
    if (status === 'Assistance Provided') reqStatus = 'Delivered';
    if (status === 'Completed') reqStatus = 'Resolved';

    request.status = reqStatus;
    request.statusHistory.push({
      status: reqStatus,
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: note || `Volunteer updated step to: ${status}`,
      timestamp: new Date(),
    });
    await request.save();

    // If completed, update volunteer stats
    if (status === 'Completed') {
      const profile = await VolunteerProfile.findOne({ userId: req.user._id });
      if (profile) {
        profile.activeTaskCount = Math.max(0, profile.activeTaskCount - 1);
        profile.totalTasksCompleted += 1;
        profile.peopleHelpedCount += request.peopleAffected || 1;
        profile.currentTasks = profile.currentTasks.filter((t) => t.toString() !== request._id.toString());
        await profile.save();
      }
    }

    // Real-time notifications
    const io = getIO();
    if (io) {
      io.to(`request:${request._id}`).emit('task:status_updated', {
        requestId: request._id,
        taskStatus: status,
        requestStatus: reqStatus,
        updatedBy: req.user.name,
      });
      io.to(`user:${request.survivorId._id}`).emit('task:status_updated', {
        requestId: request._id,
        taskStatus: status,
        requestStatus: reqStatus,
      });
    }

    await createNotification({
      recipient: request.survivorId._id,
      title: `Task Progress: ${status}`,
      message: `Volunteer ${req.user.name} updated task status to "${status}".`,
      type: 'status_update',
      priority: status === 'Completed' ? 'high' : 'normal',
      link: `/survivor/requests/${request._id}`,
    });

    return sendSuccess(res, { request, assignment }, `Task status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

// POST /volunteers/tasks/:id/decline
export const declineTask = async (req, res, next) => {
  try {
    const { reason = 'Volunteer unavailable' } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    // Reset request assignment so others can take it
    request.status = 'Submitted';
    request.assignedTo = undefined;
    request.statusHistory.push({
      status: 'Submitted',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: `Declined by volunteer: ${reason}. Returned to open pool.`,
      timestamp: new Date(),
    });
    await request.save();

    await Assignment.findOneAndUpdate(
      { requestId: request._id, responderId: req.user._id },
      { status: 'Declined', declineReason: reason }
    );

    const profile = await VolunteerProfile.findOne({ userId: req.user._id });
    if (profile) {
      profile.activeTaskCount = Math.max(0, profile.activeTaskCount - 1);
      profile.currentTasks = profile.currentTasks.filter((t) => t.toString() !== request._id.toString());
      await profile.save();
    }

    const io = getIO();
    if (io) {
      io.emit('request:created', request); // Re-broadcast to open pool
    }

    return sendSuccess(res, null, 'Task declined. Request returned to open queue.');
  } catch (error) {
    next(error);
  }
};

// PATCH /volunteers/availability
export const toggleAvailability = async (req, res, next) => {
  try {
    const profile = await VolunteerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return sendError(res, 'Volunteer profile not found', 404);
    }

    profile.isAvailable = req.body.isAvailable !== undefined ? Boolean(req.body.isAvailable) : !profile.isAvailable;
    await profile.save();

    return sendSuccess(res, { isAvailable: profile.isAvailable }, `Availability updated to ${profile.isAvailable ? 'Available' : 'Unavailable'}`);
  } catch (error) {
    next(error);
  }
};

// PATCH /volunteers/profile
export const updateVolunteerProfile = async (req, res, next) => {
  try {
    const { skills, serviceRadiusKm, experienceYears } = req.body;
    const profile = await VolunteerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return sendError(res, 'Volunteer profile not found', 404);
    }

    if (skills) profile.skills = skills;
    if (serviceRadiusKm) profile.serviceRadiusKm = Number(serviceRadiusKm);
    if (experienceYears) profile.experienceYears = Number(experienceYears);
    await profile.save();

    return sendSuccess(res, profile, 'Volunteer profile updated successfully');
  } catch (error) {
    next(error);
  }
};
