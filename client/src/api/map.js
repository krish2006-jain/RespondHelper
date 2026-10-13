import api from './client';

export const mapAPI = {
  getEntities: (params) => api.get('/map/entities', { params }),
};
