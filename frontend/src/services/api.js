import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('securestep_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 404) {
      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        return Promise.reject(new Error(serverMsg));
      }
      return Promise.reject(
        new Error(
          'API route not found. Stop the old backend and restart: cd backend && npm start'
        )
      );
    }
    if (error.response?.status === 502 || error.code === 'ERR_BAD_RESPONSE') {
      return Promise.reject(
        new Error(
          'Cannot reach the API server. Open a terminal, run: cd backend && npm start'
        )
      );
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return Promise.reject(
        new Error(
          'Cannot reach the API server. Make sure the backend is running (cd backend && npm start).'
        )
      );
    }
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  requestRegistrationOtp: (data) => api.post('/auth/register/request-otp', data),
  verifyRegistrationOtp: (data) => api.post('/auth/register/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  getPreferences: () => api.get('/users/me/preferences'),
  updatePreferences: (data) => api.patch('/users/me/preferences', data),
  enable2FA: () => api.post('/users/me/2fa/enable'),
  disable2FA: () => api.post('/users/me/2fa/disable'),
};

export const contactsApi = {
  list: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  setPushPriority: async (id, pushPriority) => {
    try {
      return await api.patch(`/contacts/${id}/priority`, { pushPriority });
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('route not found') || msg.includes('API route')) {
        return api.put(`/contacts/${id}`, { pushPriority });
      }
      throw err;
    }
  },
  remove: (id) => api.delete(`/contacts/${id}`),
};

export const incidentsApi = {
  list: () => api.get('/incidents'),
  getActive: () => api.get('/incidents/active'),
  create: (data) => api.post('/incidents', data),
  uploadSosPhoto: (id, data) => api.post(`/incidents/${id}/sos-photo`, data),
  dispatchPush: (id) => api.post(`/incidents/${id}/dispatch-push`),
  listIncoming: () => api.get('/incidents/incoming'),
  getIncoming: (id) => api.get(`/incidents/incoming/${id}`),
  resolve: (id) => api.patch(`/incidents/${id}/resolve`),
};

export const locationApi = {
  getLatest: () => api.get('/location'),
  update: (data) => api.post('/location/update', data),
  getTracking: () => api.get('/location/tracking'),
  setTracking: (enabled) => api.post('/location/tracking', { enabled }),
};

export const evidenceApi = {
  list: () => api.get('/evidence'),
  create: (data) => api.post('/evidence', data),
  remove: (id) => api.delete(`/evidence/${id}`),
};

export const chatApi = {
  getMessages: () => api.get('/chat/messages'),
  send: (text) => api.post('/chat/messages', { text }),
};

export const trustedGroupsApi = {
  list: () => api.get('/trusted-groups'),
  create: (data) => api.post('/trusted-groups', data),
  update: (id, data) => api.put(`/trusted-groups/${id}`, data),
  remove: (id) => api.delete(`/trusted-groups/${id}`),
};

export const journeysApi = {
  list: () => api.get('/journeys'),
  getActive: () => api.get('/journeys/active'),
  start: (data) => api.post('/journeys/start', data),
  complete: (id) => api.post(`/journeys/${id}/complete`),
  cancel: (id) => api.post(`/journeys/${id}/cancel`),
};

export const pushApi = {
  getStatus: () => api.get('/push/status'),
  register: (token) => api.post('/push/register', { token }),
  unregister: (token) => api.post('/push/unregister', { token }),
};

export const privacyApi = {
  getSettings: () => api.get('/privacy/settings'),
  updateSettings: (data) => api.patch('/privacy/settings', data),
  getDataSummary: () => api.get('/privacy/data-summary'),
  deleteData: (data) => api.post('/privacy/delete', data),
};

export default api;
