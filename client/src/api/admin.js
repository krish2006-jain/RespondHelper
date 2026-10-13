import api from './client';

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleBlockUser: (id) => api.patch(`/admin/users/${id}/block`),
  getAnalytics: () => api.get('/admin/analytics'),
  reassignRequest: (requestId, responderId) => api.post(`/admin/requests/${requestId}/reassign`, { responderId }),

  getVerificationQueue: (params) => api.get('/admin/verifications', { params }),
  reviewVerification: (userId, data) => api.patch(`/admin/verifications/${userId}`, data),
  submitVerification: (formData) => api.post('/verification/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};
