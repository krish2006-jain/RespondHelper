import api from './client';

export const shelterAPI = {
  getAll: (params) => api.get('/shelters', { params }),
  getNearby: (params) => api.get('/shelters/nearby', { params }),
  getMyShelter: () => api.get('/shelters/my-shelter'),
  create: (data) => api.post('/shelters', data),
  update: (id, data) => api.patch(`/shelters/${id}`, data),
  updateOccupancy: (id, deltaOrExact) => api.patch(`/shelters/${id}/occupancy`, deltaOrExact),
  getAssignedRequests: () => api.get('/shelters/assigned-requests'),
  acceptRequest: (id) => api.post(`/shelters/requests/${id}/accept`),
  allocateBeds: (id, data) => api.post(`/shelters/requests/${id}/allocate`, data),
  declineRequest: (id, data) => api.post(`/shelters/requests/${id}/decline`, data),
};
