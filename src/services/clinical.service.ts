import api from '@/lib/axios';

interface StaffPayload {
  fullName: string; email: string; password: string; phone: string;
  role: string; gender?: string; hospitalId?: string;
  department?: string; specialization?: string; staffId?: string;
  medicalLicense?: string; consultationFee?: number; maxDailyPatients?: number;
}

export const clinicalService = {
  // ─── Staff ──────────────────────────────────────────────────────────
  registerStaff: (data: StaffPayload) => api.post('/clinical/staff/register', data),
  listStaff: (params?: Record<string, string>) => api.get('/clinical/staff', { params }),
  updateStaff: (id: string, data: Record<string, unknown>) => api.put(`/clinical/staff/${id}`, data),

  // ─── Profile ────────────────────────────────────────────────────────
  getMyProfile: () => api.get('/clinical/me/profile'),
  updateMyProfile: (data: Record<string, unknown>) => api.put('/clinical/me/profile', data),

  // ─── Triage ─────────────────────────────────────────────────────────
  getTriageQueue: (params?: Record<string, string>) => api.get('/clinical/triage/queue', { params }),
  recordTriage: (patientId: string, data: Record<string, unknown>) => api.post(`/clinical/triage/${patientId}`, data),
  recordVitals: (patientId: string, data: Record<string, unknown>) => api.post(`/clinical/vitals/${patientId}`, data),
  getPatientVitals: (patientId: string) => api.get(`/clinical/vitals/${patientId}`),
  escalateToDoctor: (data: Record<string, unknown>) => api.post('/clinical/triage/escalate', data),

  // ─── Pharmacy ───────────────────────────────────────────────────────
  getPendingPrescriptions: (params?: Record<string, string>) => api.get('/clinical/pharmacy/prescriptions', { params }),
  getPrescriptionDetail: (id: string) => api.get(`/clinical/pharmacy/prescriptions/${id}`),
  reviewPrescription: (prescriptionId: string, data: Record<string, unknown>) => api.post(`/clinical/pharmacy/review/${prescriptionId}`, data),
  dispensePrescription: (prescriptionId: string, data: Record<string, unknown>) => api.post(`/clinical/pharmacy/dispense/${prescriptionId}`, data),
  getPharmacyHistory: (patientId: string) => api.get(`/clinical/pharmacy/history/${patientId}`),

  // ─── Laboratory ─────────────────────────────────────────────────────
  getLabRequests: (params?: Record<string, string>) => api.get('/clinical/lab/requests', { params }),
  collectSample: (requestId: string, data: Record<string, unknown>) => api.put(`/clinical/lab/collect/${requestId}`, data),
  uploadLabResult: (requestId: string, data: Record<string, unknown>) => api.put(`/clinical/lab/result/${requestId}`, data),
  getCriticalResults: () => api.get('/clinical/lab/critical'),
  getPatientLabResults: (patientId: string) => api.get(`/clinical/lab/results/${patientId}`),

  // ─── Adherence ──────────────────────────────────────────────────────
  getPoorAdherencePatients: (params?: Record<string, string>) => api.get('/clinical/adherence/patients', { params }),
  createCounselingSession: (data: Record<string, unknown>) => api.post('/clinical/adherence/session', data),
  getPatientCounselingSessions: (patientId: string) => api.get(`/clinical/adherence/sessions/${patientId}`),
  updateCounselingSession: (id: string, data: Record<string, unknown>) => api.put(`/clinical/adherence/session/${id}`, data),

  // ─── Case Management ────────────────────────────────────────────────
  getHighRiskPatients: () => api.get('/clinical/case/high-risk'),
  openCaseRecord: (data: Record<string, unknown>) => api.post('/clinical/case/open', data),
  getMyCases: (params?: Record<string, string>) => api.get('/clinical/case/mine', { params }),
  getPatientCaseRecord: (patientId: string) => api.get(`/clinical/case/${patientId}`),
  updateCaseRecord: (id: string, data: Record<string, unknown>) => api.put(`/clinical/case/${id}`, data),
  addIntervention: (id: string, data: Record<string, unknown>) => api.post(`/clinical/case/${id}/intervention`, data),
  createReferral: (data: Record<string, unknown>) => api.post('/clinical/case/referral', data),
  getMyReferrals: () => api.get('/clinical/case/referrals/mine'),

  // ─── Timeline ───────────────────────────────────────────────────────
  getPatientTimeline: (patientId: string) => api.get(`/clinical/timeline/${patientId}`),

  // ─── Reminders ──────────────────────────────────────────────────────
  listReminders: (params?: Record<string, string>) => api.get('/clinical/reminders', { params }),
  getMyReminders: () => api.get('/clinical/reminders/my'),
  createReminder: (data: Record<string, unknown>) => api.post('/clinical/reminders', data),
  getReminder: (id: string) => api.get(`/clinical/reminders/${id}`),
  updateReminder: (id: string, data: Record<string, unknown>) => api.put(`/clinical/reminders/${id}`, data),
  deleteReminder: (id: string) => api.delete(`/clinical/reminders/${id}`),
  reminderAction: (id: string, data: Record<string, unknown>) => api.post(`/clinical/reminders/${id}/action`, data),

  // ─── Adherence Analytics ────────────────────────────────────────────
  getAdherenceAnalytics: (patientId: string, params?: Record<string, string>) => api.get(`/clinical/adherence/analytics/${patientId}`, { params }),
  getMyAdherenceOverview: () => api.get('/clinical/adherence/overview'),

  // ─── Escalations ────────────────────────────────────────────────────
  getEscalations: (params?: Record<string, string>) => api.get('/clinical/escalations', { params }),
  resolveEscalation: (reminderId: string, escalationIndex: number, data: Record<string, unknown>) =>
    api.post(`/clinical/escalations/${reminderId}/resolve/${escalationIndex}`, data),

  // ─── VOA Profiles ───────────────────────────────────────────────────
  getMyVOAProfile: () => api.get('/clinical/voa-profile/me'),
  updateMyVOAProfile: (data: Record<string, unknown>) => api.put('/clinical/voa-profile/me', data),
  getVOAProfile: (id: string) => api.get(`/clinical/voa-profile/${id}`),
  listVOAProfiles: (params?: Record<string, string>) => api.get('/clinical/voa-profiles', { params }),

  // ─── Prescription ────────────────────────────────────────────────────
  createPrescription: (data: Record<string, unknown>) => api.post('/clinical/prescriptions', data),

  // ─── Lab Request ─────────────────────────────────────────────────────
  requestLab: (data: Record<string, unknown>) => api.post('/clinical/lab/request', data),

  // ─── Patient Search ─────────────────────────────────────────────────
  searchPatients: (q: string) => api.get('/clinical/patients/search', { params: { q } }),
  getPatientDetail: (id: string) => api.get(`/clinical/patients/${id}`),

  // ─── Workflow: PatientVisit ────────────────────────────────────────
  getWorkflowQueue: (params?: Record<string, string>) => api.get('/clinical/workflow/queue', { params }),
  getWorkflowDoctorQueue: () => api.get('/clinical/workflow/doctor-queue'),
  getActiveWorkflowVisits: (params?: Record<string, string>) => api.get('/clinical/workflow/visits', { params }),
  getWorkflowVisitById: (id: string) => api.get(`/clinical/workflow/visits/${id}`),
  checkInPatient: (data: Record<string, unknown>) => api.post('/clinical/workflow/check-in', data),
  transitionWorkflowVisit: (visitId: string, data: Record<string, unknown>) =>
    api.post(`/clinical/workflow/transition/${visitId}`, data),
  dischargePatient: (visitId: string, data: Record<string, unknown>) =>
    api.post(`/clinical/workflow/discharge/${visitId}`, data),
  startVisitConsultation: (visitId: string) =>
    api.post(`/clinical/workflow/start-consultation/${visitId}`),
};
