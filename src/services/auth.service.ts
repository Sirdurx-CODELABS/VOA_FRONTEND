import api from '@/lib/axios';

export const authService = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { fullName: string; email: string; password: string; phone?: string }) => api.post('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', data),
};
