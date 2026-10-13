import api from './client';

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateLocation: (coords) => api.patch('/auth/location', coords),
  logout: () => api.post('/auth/logout'),
};
