import { Resource } from '../models/Resource.js';
import { Request } from '../models/Request.js';
import { Assignment } from '../models/Assignment.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { createNotification } from '../services/notificationService.js';
import { getIO } from '../config/socket.js';
import { ENV } from '../config/env.js';

// GET /resources
export const getResources = async (req, res, next) => {
  try {
    const { category, alertStatus, providerId, search, page = 1, limit = 20 } = req.query;
    const query = {};

    // If NGO/provider, default to their resources if requested, or allow view of all for network sharing
    if (providerId) {
      query.providerId = providerId;
    }
    if (category) {
      query.category = category;
    }
    if (alertStatus) {
      query.alertStatus = alertStatus;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .populate('providerId', 'name phone email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return sendSuccess(res, {
      resources,
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

// POST /resources
export const createResource = async (req, res, next) => {
  try {
    const { name, category, quantity, unit = 'units', location, address, expiryDate, description } = req.body;

    if (!name || !category || quantity == null) {
      return sendError(res, 'Name, category, and quantity are required.', 400);
    }

    const coordinates = location?.coordinates ||
      (req.user.location?.coordinates?.length === 2
        ? req.user.location.coordinates
        : [ENV.MAP_DEFAULT_LNG, ENV.MAP_DEFAULT_LAT]);

    const resource = await Resource.create({
      providerId: req.user._id,
      name,
      category,
      quantity: Number(quantity),
      initialQuantity: Number(quantity),
      unit,
      location: {
        type: 'Point',
        coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])],
      },
      address: address || req.user.address || 'Relief Depot, Mumbai',
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      description: description || '',
      alertStatus: 'Available',
    });

    const io = getIO();
    if (io) {
      io.emit('map:entity_created', { type: 'resource', entity: resource });
    }

    return sendSuccess(res, resource, 'Resource inventory item added successfully', 201);
  } catch (error) {
    next(error);
  }
};

// PATCH /resources/:id
export const updateResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return sendError(res, 'Resource not found', 404);
    }

    // Providers can only update their own resources unless admin
    if (
      req.user.role !== 'admin' &&
      resource.providerId.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Unauthorized to edit this resource.', 403);
    }

    const { name, category, quantity, unit, location, address, expiryDate, description, changeReason } = req.body;

    if (quantity !== undefined && Number(quantity) !== resource.quantity) {
      const prev = resource.quantity;
      const nextQty = Number(quantity);
      resource.stockHistory.push({
        previousQuantity: prev,
        newQuantity: nextQty,
        change: nextQty - prev,
        reason: changeReason || 'Manual adjustment',
        changedBy: req.user._id,
        timestamp: new Date(),
      });
      resource.quantity = nextQty;

      // Update status based on quantity
      const lowStockLimit = (resource.initialQuantity * ENV.LOW_STOCK_THRESHOLD_PERCENT) / 100;
      if (resource.quantity <= lowStockLimit || resource.quantity === 0) {
        resource.alertStatus = 'Low Stock';
      } else {
        resource.alertStatus = 'Available';
      }
    }

    if (name) resource.name = name;
    if (category) resource.category = category;
    if (unit) resource.unit = unit;
    if (address) resource.address = address;
    if (description !== undefined) resource.description = description;
    if (expiryDate) resource.expiryDate = new Date(expiryDate);
    if (location?.coordinates) {
      resource.location = {
        type: 'Point',
        coordinates: [parseFloat(location.coordinates[0]), parseFloat(location.coordinates[1])],
      };
    }

    await resource.save();
    return sendSuccess(res, resource, 'Resource updated successfully');
  } catch (error) {
    next(error);
  }
};

// DELETE /resources/:id
export const deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return sendError(res, 'Resource not found', 404);
    }

    if (req.user.role !== 'admin' && resource.providerId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Unauthorized to delete this resource.', 403);
    }

    await Resource.findByIdAndDelete(req.params.id);
    return sendSuccess(res, null, 'Resource deleted successfully');
  } catch (error) {
    next(error);
  }
};

// GET /resources/alerts
export const getResourceAlerts = async (req, res, next) => {
  try {
    const query = {
      alertStatus: { $in: ['Low Stock', 'Expiring Soon', 'Expired'] },
    };
    if (req.user.role === 'ngo' || req.user.role === 'resource_provider') {
      query.providerId = req.user._id;
    }

    const alerts = await Resource.find(query).sort({ alertStatus: 1, updatedAt: -1 });
    return sendSuccess(res, alerts, 'Resource alerts retrieved');
  } catch (error) {
    next(error);
  }
};

// POST /resources/:id/assign
export const assignResource = async (req, res, next) => {
  try {
    const { requestId, quantityToAllocate } = req.body;
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return sendError(res, 'Resource not found', 404);
    }

    const request = await Request.findById(requestId).populate('survivorId', 'name phone email');
    if (!request) {
      return sendError(res, 'Request not found', 404);
    }

    const allocQty = parseInt(quantityToAllocate, 10) || request.peopleAffected || 1;

    if (resource.quantity < allocQty) {
      return sendError(
        res,
        `Insufficient stock. Requested ${allocQty} ${resource.unit}, but only ${resource.quantity} are available.`,
        400
      );
    }

    // Deduct stock
    const prev = resource.quantity;
    resource.quantity -= allocQty;
    resource.stockHistory.push({
      previousQuantity: prev,
      newQuantity: resource.quantity,
      change: -allocQty,
      reason: `Allocated to Request #${request._id}`,
      changedBy: req.user._id,
      timestamp: new Date(),
    });

    if (resource.quantity <= (resource.initialQuantity * ENV.LOW_STOCK_THRESHOLD_PERCENT) / 100) {
      resource.alertStatus = 'Low Stock';
    }
    await resource.save();

    // Update request
    request.status = 'Assigned';
    request.assignedTo = {
      responderId: req.user._id,
      responderRole: req.user.role,
      responderName: req.user.name,
      responderPhone: req.user.phone,
      assignedAt: new Date(),
    };
    request.statusHistory.push({
      status: 'Assigned',
      updatedBy: req.user._id,
      updatedByName: req.user.name,
      note: `Resource "${resource.name}" (${allocQty} ${resource.unit}) assigned by ${req.user.name}`,
      timestamp: new Date(),
    });
    await request.save();

    // Create assignment record
    const assignment = await Assignment.create({
      requestId: request._id,
      responderId: req.user._id,
      responderRole: req.user.role,
      resourceId: resource._id,
      allocatedQuantity: allocQty,
      status: 'Assigned',
      startedAt: new Date(),
    });

    // Notify survivor
    await createNotification({
      recipient: request.survivorId._id,
      title: 'Resource Dispatched!',
      message: `${allocQty} ${resource.unit} of ${resource.name} has been assigned to your request by ${req.user.name}.`,
      type: 'assignment',
      priority: 'high',
      link: `/survivor/requests/${request._id}`,
    });

    const io = getIO();
    if (io) {
      io.to(`request:${request._id}`).emit('request:status_changed', {
        requestId: request._id,
        status: 'Assigned',
        resourceAllocated: { name: resource.name, quantity: allocQty, unit: resource.unit },
      });
    }

    return sendSuccess(res, { request, resource, assignment }, 'Resource assigned successfully');
  } catch (error) {
    next(error);
  }
};
