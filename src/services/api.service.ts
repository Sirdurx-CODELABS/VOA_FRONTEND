import api from '@/lib/axios';

export const userService = {
  getAll: (params?: object) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: object) => api.put(`/users/${id}`, data),
  updateMyProfile: (data: object) => api.put('/users/me/profile', data),
  approve: (id: string, data?: { role?: string; isVice?: boolean }) => api.patch(`/users/${id}/approve`, data || {}),
  reject: (id: string) => api.patch(`/users/${id}/reject`),
  activate: (id: string) => api.patch(`/users/${id}/activate`),
  assignRole: (id: string, data: object) => api.patch(`/users/${id}/assign-role`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  uploadProfileImage: (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.put('/users/profile/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const programService = {
  getAll: (params?: object) => api.get('/programs', { params }),
  getById: (id: string) => api.get(`/programs/${id}`),
  create: (data: object) => api.post('/programs', data),
  update: (id: string, data: object) => api.put(`/programs/${id}`, data),
  delete: (id: string) => api.delete(`/programs/${id}`),
  assignMembers: (id: string, memberIds: string[]) => api.post(`/programs/${id}/assign-members`, { memberIds }),
};

export const attendanceService = {
  record: (data: object) => api.post('/attendance', data),
  bulkRecord: (data: object) => api.post('/attendance/bulk', data),
  getByProgram: (programId: string, params?: object) => api.get(`/attendance/program/${programId}`, { params }),
  getSummary: (programId: string) => api.get(`/attendance/program/${programId}/summary`),
  getByUser: (userId: string) => api.get(`/attendance/user/${userId}`),
  getMyAttendance: () => api.get('/attendance/me'),
};

export const transactionService = {
  getAll: (params?: object) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
  create: (data: object) => api.post('/transactions', data),
  approve: (id: string) => api.patch(`/transactions/${id}/approve`),
  reject: (id: string) => api.patch(`/transactions/${id}/reject`),
  getSummary: (params?: object) => api.get('/transactions/summary', { params }),
};

export const reportService = {
  getAll: (params?: object) => api.get('/reports', { params }),
  getById: (id: string) => api.get(`/reports/${id}`),
  create: (data: FormData) => api.post('/reports', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: object) => api.put(`/reports/${id}`, data),
  delete: (id: string) => api.delete(`/reports/${id}`),
};

export const announcementService = {
  getAll: (params?: object) => api.get('/announcements', { params }),
  getPublic: (params?: object) => api.get('/announcements/public', { params }),
  getById: (id: string) => api.get(`/announcements/${id}`),
  getMyCategories: () => api.get('/announcements/my-categories'),
  create: (data: FormData) => api.post('/announcements', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: object) => api.put(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};

export const welfareService = {
  getAll: (params?: object) => api.get('/welfare', { params }),
  getById: (id: string) => api.get(`/welfare/${id}`),
  create: (data: FormData) => api.post('/welfare', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateStatus: (id: string, status: string) => api.patch(`/welfare/${id}/status`, { status }),
  addFollowUp: (id: string, note: string) => api.post(`/welfare/${id}/follow-up`, { note }),
};

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getMyDashboard: () => api.get('/analytics/my-dashboard'),
  getMemberStats: () => api.get('/analytics/members'),
  getLeaderboard: (limit?: number) => api.get('/analytics/leaderboard', { params: { limit } }),
  getProgramMetrics: () => api.get('/analytics/programs'),
  getInactiveUsers: () => api.get('/analytics/inactive-users'),
};

export const notificationService = {
  getAll: (params?: object) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const superAdminService = {
  // System
  getStats: () => api.get('/superadmin/stats'),
  getAuditLogs: (params?: object) => api.get('/superadmin/audit-logs', { params }),

  // Users
  getUsers: (params?: object) => api.get('/superadmin/users', { params }),
  createUser: (data: object) => api.post('/superadmin/users', data),
  updateUser: (id: string, data: object) => api.put(`/superadmin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/superadmin/users/${id}`),
  resetPassword: (id: string, newPassword: string) => api.patch(`/superadmin/users/${id}/reset-password`, { newPassword }),
  toggleStatus: (id: string) => api.patch(`/superadmin/users/${id}/toggle-status`),

  // Programs
  getPrograms: (params?: object) => api.get('/superadmin/programs', { params }),
  createProgram: (data: object) => api.post('/superadmin/programs', data),
  updateProgram: (id: string, data: object) => api.put(`/superadmin/programs/${id}`, data),
  deleteProgram: (id: string) => api.delete(`/superadmin/programs/${id}`),

  // Transactions
  getTransactions: (params?: object) => api.get('/superadmin/transactions', { params }),
  updateTransaction: (id: string, data: object) => api.put(`/superadmin/transactions/${id}`, data),
  deleteTransaction: (id: string) => api.delete(`/superadmin/transactions/${id}`),

  // Welfare
  getWelfare: (params?: object) => api.get('/superadmin/welfare', { params }),
  updateWelfare: (id: string, data: object) => api.put(`/superadmin/welfare/${id}`, data),
  deleteWelfare: (id: string) => api.delete(`/superadmin/welfare/${id}`),

  // Announcements / Reports
  deleteAnnouncement: (id: string) => api.delete(`/superadmin/announcements/${id}`),
  deleteReport: (id: string) => api.delete(`/superadmin/reports/${id}`),
};

export const positionService = {
  getAll: (params?: object) => api.get('/position-applications', { params }),
  getById: (id: string) => api.get(`/position-applications/${id}`),
  submit: (data: object) => api.post('/position-applications', data),
  membershipReview: (id: string, data: { decision: string; note?: string }) => api.patch(`/position-applications/${id}/membership-review`, data),
  chairmanReview: (id: string, data: { decision: string; note?: string }) => api.patch(`/position-applications/${id}/chairman-review`, data),
  superAdminApprove: (id: string) => api.patch(`/position-applications/${id}/superadmin-approve`),
};

export const roleChangeService = {
  getAll: (params?: object) => api.get('/role-change-requests', { params }),
  create: (data: object) => api.post('/role-change-requests', data),
  chairmanApprove: (id: string, data: { decision: string; note?: string }) => api.patch(`/role-change-requests/${id}/chairman-approve`, data),
  superAdminApprove: (id: string) => api.patch(`/role-change-requests/${id}/superadmin-approve`),
};

export const contributionService = {
  getSummary: (month?: string) => api.get('/contributions/summary', { params: { month } }),
  getRequiredAmount: () => api.get('/contributions/required-amount'),
  getMonthlyStatus: (month?: string) => api.get('/contributions/monthly-status', { params: { month } }),
  getMyPoints: () => api.get('/contributions/my-points'),
  getAllInstallments: (params?: object) => api.get('/contributions/installments', { params }),
  getAllMonthlyRecords: (params?: object) => api.get('/contributions/monthly-records', { params }),
  submitInstallment: (data: FormData) => api.post('/contributions/installments', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  approveInstallment: (id: string) => api.patch(`/contributions/installments/${id}/approve`),
  rejectInstallment: (id: string, reason: string) => api.patch(`/contributions/installments/${id}/reject`, { reason }),
  recalculate: (month?: string) => api.post('/contributions/recalculate', {}, { params: { month } }),
};

export const accountService = {
  getAll: () => api.get('/accounts'),
  create: (data: object) => api.post('/accounts', data),
  update: (id: string, data: object) => api.put(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
};

export const childService = {
  getMyChildren: () => api.get('/children/my'),
  getParentChildren: (parentId: string) => api.get(`/children/parent/${parentId}`),
  addChild: (data: object) => api.post('/children/my', data),
  addChildForParent: (parentId: string, data: object) => api.post(`/children/parent/${parentId}`, data),
  updateChild: (childId: string, data: object) => api.put(`/children/my/${childId}`, data),
  deleteChild: (childId: string) => api.delete(`/children/my/${childId}`),
  createChildAccount: (childId: string, data: object) => api.post(`/children/my/${childId}/create-account`, data),
};

export const financeTargetService = {
  getAll: (params?: object) => api.get('/finance-targets', { params }),
  getById: (id: string) => api.get(`/finance-targets/${id}`),
  getSummary: () => api.get('/finance-targets/summary'),
  create: (data: object) => api.post('/finance-targets', data),
  update: (id: string, data: object) => api.put(`/finance-targets/${id}`, data),
  markComplete: (id: string) => api.patch(`/finance-targets/${id}/complete`),
  delete: (id: string) => api.delete(`/finance-targets/${id}`),
};

export const pointsService = {
  getMyHistory: () => api.get('/contributions/my-points'),
};

export const activityService = {
  getAll: (params?: object) => api.get('/activities', { params }),
  getById: (id: string) => api.get(`/activities/${id}`),
  getMy: () => api.get('/activities/my'),
  create: (data: object) => api.post('/activities', data),
  update: (id: string, data: object) => api.put(`/activities/${id}`, data),
  delete: (id: string) => api.delete(`/activities/${id}`),
  filterMembers: (criteria: object) => api.post('/activities/filter-members', criteria),
  invite: (id: string, userIds: string[]) => api.post(`/activities/${id}/invite`, { userIds }),
  removeInvitee: (id: string, userId: string) => api.delete(`/activities/${id}/invite/${userId}`),
  respond: (id: string, data: { responseStatus: string; responseReason?: string }) => api.patch(`/activities/${id}/respond`, data),
  markAttendance: (id: string, data: { attendanceStatus: string; attendanceReason?: string }) => api.patch(`/activities/${id}/attendance`, data),
  getGallery: (params?: object) => api.get('/activities/gallery', { params }),
  uploadMedia: (id: string, data: FormData) => api.post(`/activities/${id}/media`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteMedia: (mediaId: string) => api.delete(`/activities/media/${mediaId}`),
  getPublicMedia: (token: string) => api.get(`/activities/gallery/public/${token}`),
};
