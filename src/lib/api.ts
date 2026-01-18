import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for allowing cookies
});

// Response interceptor for handling errors globally (optional)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (redirect to login or clear state)
      console.warn('Unauthorized access, redirecting to login...');
      // window.location.href = '/auth'; // Be careful with loop
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (data: any) => api.post('/auth/signup', data),
  login: (data: any) => api.post('/auth/login', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const dataApi = {
  getReferrals: () => api.get('/referrals'),
  createReferral: (data: any) => api.post('/referrals', data),
  updateReferral: (id: string, data: any) => api.put(`/referrals/${id}`, data),
  getFacilities: () => api.get('/facilities'),
  getStats: () => api.get('/stats'),
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/notifications/read-all'),
  // Admin
  getSecurityStats: () => api.get('/admin/security-stats'),
  getAdminStats: () => api.get('/admin/stats'),
  getPendingUsers: () => api.get('/admin/users/pending'),
  getHealthcareProviders: () => api.get('/admin/users/providers'),
  getPatients: () => api.get('/patients'),
  activateUser: (userId: string, role?: string) => api.post(`/admin/users/${userId}/activate`, { role }),
  assignFacility: (userId: string, data: { facilityId: string, role: string }) => api.put(`/admin/users/${userId}/facility`, data),
  createRegistrationCode: (data: any) => api.post('/admin/codes', data),
  getFacilityLevels: () => api.get('/facility-levels'),
  // Generic notification send (admin)
  sendNotification: (data: any) => api.post('/notifications', data),
  getSentNotifications: () => api.get('/admin/notifications/sent'),
  getFaqs: () => api.get('/faqs'),
  submitFeedback: (data: any) => api.post('/feedback', data),
  // Consent
  getConsents: () => api.get('/consents'),
  updateConsent: (data: any) => api.post('/consents', data),
};

export default api;
