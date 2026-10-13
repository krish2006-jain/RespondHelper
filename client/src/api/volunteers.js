import api from './client';

export const volunteerAPI = {
  getNearbyRequests: () => api.get('/volunteers/nearby-requests'),
  getActiveTasks: () => api.get('/volunteers/active-tasks'),
  acceptTask: (requestId) => api.post(`/volunteers/tasks/${requestId}/accept`),
  updateTaskStatus: (requestId, data) => api.patch(`/volunteers/tasks/${requestId}/status`, data),
  declineTask: (requestId, reason) => api.post(`/volunteers/tasks/${requestId}/decline`, { reason }),
  toggleAvailability: (isAvailable) => api.patch('/volunteers/availability', { isAvailable }),
  updateProfile: (data) => api.patch('/volunteers/profile', data),
};
