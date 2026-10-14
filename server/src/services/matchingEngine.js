import { Resource } from '../models/Resource.js';
import { VolunteerProfile } from '../models/VolunteerProfile.js';
import { User } from '../models/User.js';
import { calculateDistanceKm } from '../utils/geoUtils.js';
import { ENV } from '../config/env.js';

/**
 * Intelligent Resource Matching Engine
 * Urgency + Distance + Quantity + Availability
 */
export const findMatchingResources = async (request, options = {}) => {
  const { maxRadiusKm = ENV.MATCH_MAX_RADIUS_KM, limit = ENV.MATCH_MAX_RESULTS } = options;
  const reqCoords = request.location?.coordinates || [72.8777, 19.0760];
  const reqCategory = request.category;
  const reqPriority = request.priority || 'High';
  const reqQuantity = request.peopleAffected || 1;

  // Category mapping: cross-match medical/medicine, food/rations, water, rescue
  const categoryMap = {
    'Medical Assistance': ['Medical Assistance', 'Medicine', 'Emergency Supplies'],
    Medicine: ['Medicine', 'Medical Assistance', 'Emergency Supplies'],
    Food: ['Food', 'Emergency Supplies'],
    Water: ['Water', 'Emergency Supplies'],
    Rescue: ['Rescue', 'Equipment', 'Emergency Supplies'],
    Shelter: ['Shelter', 'Emergency Supplies'],
    Clothing: ['Clothing', 'Emergency Supplies'],
    Equipment: ['Equipment', 'Rescue', 'Emergency Supplies'],
    'Emergency Supplies': ['Emergency Supplies', 'Medicine', 'Medical Assistance', 'Food', 'Water'],
    Other: ['Other', 'Emergency Supplies'],
  };

  const matchingCategories = categoryMap[reqCategory] || [reqCategory, 'Emergency Supplies', 'Other'];

  // Search resources matching category (or related supplies) with quantity > 0
  const candidateResources = await Resource.find({
    category: { $in: matchingCategories },
    quantity: { $gt: 0 },
  }).populate('providerId', 'name phone email role');

  const urgencyMultiplier = {
    Critical: 1.0,
    High: 0.75,
    Medium: 0.5,
    Low: 0.25,
  }[reqPriority] || 0.5;

  const weights = ENV.RESOURCE_WEIGHTS;

  const scoredCandidates = candidateResources
    .map((resource) => {
      const distanceKm = calculateDistanceKm(reqCoords, resource.location.coordinates);

      if (distanceKm > maxRadiusKm) return null;

      // Distance score (closer = higher score, max radius gives 0)
      const distanceScore = Math.max(0, 1 - distanceKm / maxRadiusKm);

      // Quantity score (enough stock = 1.0, partial stock = penalized)
      const quantityScore =
        resource.quantity >= reqQuantity
          ? 1.0
          : (resource.quantity / reqQuantity) * 0.6;

      // Availability score
      const availScore = resource.alertStatus === 'Available' ? 1.0 : 0.5;

      // Weighted overall score
      const totalScore =
        weights.urgency * urgencyMultiplier +
        weights.distance * distanceScore +
        weights.quantity * quantityScore +
        weights.availability * availScore;

      // Plain language explanation
      let reason = '';
      if (resource.quantity >= reqQuantity) {
        reason = `Has ${resource.quantity} ${resource.unit} (sufficient for ${reqQuantity}), ${distanceKm} km away`;
      } else {
        reason = `Partial stock: ${resource.quantity} ${resource.unit} available, ${distanceKm} km away`;
      }

      return {
        resource,
        distanceKm,
        score: Math.round(totalScore * 100) / 100,
        isSufficientStock: resource.quantity >= reqQuantity,
        matchReason: reason,
        isBestMatch: false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scoredCandidates.length > 0) {
    scoredCandidates[0].isBestMatch = true;
  }

  return scoredCandidates;
};

/**
 * Intelligent Volunteer Matching Engine
 * Distance + Skill + Priority + Availability + Workload
 */
export const findMatchingVolunteers = async (request, options = {}) => {
  const { limit = 10 } = options;
  const reqCoords = request.location?.coordinates || [72.8777, 19.0760];
  const reqCategory = request.category;
  const reqPriority = request.priority || 'High';

  // Category to required/preferred skills mapping
  const categorySkillMap = {
    'Medical Assistance': ['Medical Doctor', 'First Aid', 'Nurse'],
    Medicine: ['First Aid', 'Pharmacy'],
    Rescue: ['Search & Rescue', 'Boat Rescue', 'Climbing'],
    Food: ['Food Distribution', 'Logistics'],
    Water: ['Logistics', 'Food Distribution'],
    Transport: ['Driving / Logistics', 'Heavy Vehicle'],
    Shelter: ['Shelter Management', 'First Aid'],
  };

  const relevantSkills = categorySkillMap[reqCategory] || [];

  // Find verified, available volunteers with capacity
  const volunteers = await VolunteerProfile.find({
    isAvailable: true,
    activeTaskCount: { $lt: ENV.VOLUNTEER_MAX_ACTIVE_TASKS },
  }).populate({
    path: 'userId',
    match: { verificationStatus: 'verified', isBlocked: false },
    select: 'name phone email location address',
  });

  const validVolunteers = volunteers.filter((v) => v.userId != null);
  const weights = ENV.VOLUNTEER_WEIGHTS;

  const scoredVolunteers = validVolunteers
    .map((profile) => {
      const vCoords = profile.userId.location?.coordinates || [72.8777, 19.0760];
      const distanceKm = calculateDistanceKm(reqCoords, vCoords);

      // Check volunteer service radius
      if (distanceKm > profile.serviceRadiusKm) return null;

      const distanceScore = Math.max(0, 1 - distanceKm / profile.serviceRadiusKm);

      // Skill match score
      const hasDirectSkill = profile.skills.some((s) => relevantSkills.includes(s));
      const hasFirstAid = profile.skills.includes('First Aid');
      const skillScore = hasDirectSkill ? 1.0 : hasFirstAid ? 0.7 : 0.4;

      // Priority score
      const priorityScore = {
        Critical: 1.0,
        High: 0.8,
        Medium: 0.6,
        Low: 0.4,
      }[reqPriority] || 0.6;

      // Workload score (0 tasks = 1.0, 1 task = 0.5)
      const workloadScore =
        1 - profile.activeTaskCount / ENV.VOLUNTEER_MAX_ACTIVE_TASKS;

      const totalScore =
        weights.distance * distanceScore +
        weights.skill * skillScore +
        weights.priority * priorityScore +
        weights.availability * 1.0 +
        weights.workload * workloadScore;

      let matchLabel = 'Possible';
      if (totalScore >= 0.75) {
        matchLabel = 'Great';
      } else if (totalScore >= 0.60) {
        matchLabel = 'Good';
      }

      return {
        profile,
        user: profile.userId,
        distanceKm,
        score: Math.round(totalScore * 100) / 100,
        matchLabel,
        matchedSkills: profile.skills.filter((s) => relevantSkills.includes(s)),
        reason: `${distanceKm} km away • ${matchLabel} match • Skills: ${profile.skills.join(', ')}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scoredVolunteers;
};
