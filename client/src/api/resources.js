import api from './client';

export const resourceAPI = {
  getAll: (params) => api.get('/resources', { params }),
  getAlerts: () => api.get('/resources/alerts'),
  create: (data) => api.post('/resources', data),
  update: (id, data) => api.patch(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
  assign: (id, data) => api.post(`/resources/${id}/assign`, data),
};
