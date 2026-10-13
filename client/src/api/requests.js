import api from './client';

export const requestAPI = {
  create: (formData) => {
    return api.post('/requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (params) => api.get('/requests', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  getMatches: (id) => api.get(`/requests/${id}/matches`),
  updateStatus: (id, statusData) => api.patch(`/requests/${id}/status`, statusData),
  cancel: (id, reason) => api.patch(`/requests/${id}/cancel`, { reason }),
};
