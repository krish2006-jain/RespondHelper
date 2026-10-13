import { User } from '../models/User.js';
import { Request } from '../models/Request.js';
import { VolunteerProfile } from '../models/VolunteerProfile.js';
import { Shelter } from '../models/Shelter.js';
import { Resource } from '../models/Resource.js';
import { Assignment } from '../models/Assignment.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../config/socket.js';

// GET /admin/stats
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      activeEmergencies,
      activeVolunteers,
      verifiedNGOs,
      availableShelters,
      availableResources,
      pendingRequests,
      resolvedRequests,
      criticalRequests,
      totalSurvivors,
    ] = await Promise.all([
      Request.countDocuments({ status: { $in: ['Submitted', 'Verified', 'Assigned', 'In Progress'] } }),
      VolunteerProfile.countDocuments({ isAvailable: true }),
      User.countDocuments({ role: 'ngo', verificationStatus: 'verified' }),
      Shelter.countDocuments({ status: { $in: ['Available', 'Almost Full'] } }),
      Resource.countDocuments({ alertStatus: 'Available', quantity: { $gt: 0 } }),
      Request.countDocuments({ status: 'Submitted' }),
      Request.countDocuments({ status: 'Resolved' }),
      Request.countDocuments({ priority: 'Critical', status: { $ne: 'Resolved' } }),
      User.countDocuments({ role: 'survivor' }),
    ]);

    const stats = {
      activeEmergencies,
      activeVolunteers,
      verifiedNGOs,
      availableShelters,
      availableResources,
      pendingRequests,
      resolvedRequests,
      criticalRequests,
      totalSurvivors,
    };

    return sendSuccess(res, stats, 'Admin stats retrieved');
  } catch (error) {
    next(error);
  }
};

// GET /admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { role, verificationStatus, isBlocked, search, page = 1, limit = 25 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (isBlocked !== undefined) query.isBlocked = isBlocked === 'true';

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10));

    return sendSuccess(res, {
      users,
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

// PATCH /admin/users/:id/block
export const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user.role === 'admin') {
      return sendError(res, 'Cannot block an administrator account.', 400);
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    return sendSuccess(res, user, `User has been ${user.isBlocked ? 'suspended' : 'unblocked'}.`);
  } catch (error) {
    next(error);
  }
};

// GET /admin/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    // 1. Requests by Category
    const categoryAgg = await Request.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, peopleAffected: { $sum: '$peopleAffected' } } },
      { $sort: { count: -1 } },
    ]);

    // 2. Requests by Status
    const statusAgg = await Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 3. Requests by Priority
    const priorityAgg = await Request.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // 4. Shelter Occupancy Totals
    const shelters = await Shelter.find();
    const totalCapacity = shelters.reduce((acc, s) => acc + s.totalCapacity, 0);
    const totalOccupied = shelters.reduce((acc, s) => acc + s.currentOccupancy, 0);

    // 5. Total People Helped
    const volunteerStats = await VolunteerProfile.aggregate([
      { $group: { _id: null, totalPeopleHelped: { $sum: '$peopleHelpedCount' }, totalCompleted: { $sum: '$totalTasksCompleted' } } },
    ]);

    const peopleHelped = volunteerStats[0]?.totalPeopleHelped || 0;

    return sendSuccess(
      res,
      {
        categories: categoryAgg.map((c) => ({ category: c._id, count: c.count, people: c.peopleAffected })),
        statuses: statusAgg.map((s) => ({ status: s._id, count: s.count })),
        priorities: priorityAgg.map((p) => ({ priority: p._id, count: p.count })),
        shelterOccupancy: {
          totalCapacity,
          totalOccupied,
          vacant: Math.max(0, totalCapacity - totalOccupied),
          occupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
        },
        peopleHelped,
      },
      'Analytics retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// POST /admin/requests/:id/reassign
export const reassignRequest = async (req, res, next) => {
  try {
    const { responderId } = req.body;
    const request = await Request.findById(req.params.id).populate('survivorId', 'name phone email');
    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    const responder = await User.findById(responderId);
    if (!responder) {
      return sendError(res, 'Target responder not found', 404);
    }

    request.status = 'Assigned';
    request.assignedTo = {
      responderId: responder._id,
      responderRole: responder.role,
      responderName: responder.name,
      responderPhone: responder.phone,
      assignedAt: new Date(),
    };
    request.statusHistory.push({
      status: 'Assigned',
      updatedBy: req.user._id,
      updatedByName: `Admin (${req.user.name})`,
      note: `Admin manually assigned task to ${responder.name} (${responder.role})`,
      timestamp: new Date(),
    });
    await request.save();

    await Assignment.create({
      requestId: request._id,
      responderId: responder._id,
      responderRole: responder.role,
      status: 'Assigned',
      startedAt: new Date(),
    });

    if (responder.role === 'volunteer') {
      await VolunteerProfile.findOneAndUpdate(
        { userId: responder._id },
        { $inc: { activeTaskCount: 1 }, $addToSet: { currentTasks: request._id } }
      );
    }

    await createNotification({
      recipient: responder._id,
      title: 'New Emergency Assigned by Admin',
      message: `Admin assigned you to an emergency for ${request.category}.`,
      type: 'assignment',
      priority: 'high',
      link: responder.role === 'volunteer' ? `/volunteer/tasks/${request._id}` : `/ngo/assignments`,
    });

    const io = getIO();
    if (io) {
      io.to(`user:${responder._id}`).emit('task:assigned', { request });
      io.to(`request:${request._id}`).emit('request:status_changed', {
        requestId: request._id,
        status: 'Assigned',
        responder: { name: responder.name, phone: responder.phone },
      });
    }

    return sendSuccess(res, request, `Request successfully reassigned to ${responder.name}`);
  } catch (error) {
    next(error);
  }
};
