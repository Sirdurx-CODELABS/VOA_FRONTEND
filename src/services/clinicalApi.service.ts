import api from '@/lib/axios';
import {
  AIReminder, AdherenceAnalytics, AdherenceOverview, VOAProfile,
} from '@/types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Reminders ───────────────────────────────────────────────────────
export const reminderService = {
  list: (params?: { patient?: string; status?: string; reminderType?: string }) =>
    api.get<ApiResponse<AIReminder[]>>('/clinical/reminders', { params }),

  getMy: () =>
    api.get<ApiResponse<AIReminder[]>>('/clinical/reminders/my'),

  get: (id: string) =>
    api.get<ApiResponse<AIReminder>>(`/clinical/reminders/${id}`),

  create: (data: Partial<AIReminder>) =>
    api.post<ApiResponse<AIReminder>>('/clinical/reminders', data),

  update: (id: string, data: Partial<AIReminder>) =>
    api.put<ApiResponse<AIReminder>>(`/clinical/reminders/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/clinical/reminders/${id}`),

  action: (id: string, action: string, note?: string) =>
    api.post<ApiResponse<{ reminder: AIReminder; streak: number }>>(`/clinical/reminders/${id}/action`, { action, note }),
};

// ─── Adherence ───────────────────────────────────────────────────────
export const adherenceService = {
  getAnalytics: (patientId: string, days?: number) =>
    api.get<ApiResponse<AdherenceAnalytics>>(`/clinical/adherence/analytics/${patientId}`, { params: { days } }),

  getOverview: () =>
    api.get<ApiResponse<AdherenceOverview>>('/clinical/adherence/overview'),
};

// ─── Escalations ─────────────────────────────────────────────────────
export const escalationService = {
  list: (resolved?: boolean) =>
    api.get<ApiResponse<AIReminder[]>>('/clinical/escalations', { params: resolved !== undefined ? { resolved } : {} }),

  resolve: (reminderId: string, escalationIndex: number, notes?: string) =>
    api.post<ApiResponse<AIReminder>>(`/clinical/escalations/${reminderId}/resolve/${escalationIndex}`, { notes }),
};

// ─── VOA Profile ─────────────────────────────────────────────────────
export const voaProfileService = {
  getMy: () =>
    api.get<ApiResponse<VOAProfile>>('/clinical/voa-profile/me'),

  updateMy: (data: Partial<VOAProfile>) =>
    api.put<ApiResponse<VOAProfile>>('/clinical/voa-profile/me', data),

  get: (id: string) =>
    api.get<ApiResponse<VOAProfile>>(`/clinical/voa-profile/${id}`),

  list: (params?: { membershipStatus?: string; chapter?: string }) =>
    api.get<ApiResponse<VOAProfile[]>>('/clinical/voa-profiles', { params }),
};

// ─── Timeline ────────────────────────────────────────────────────────
export const timelineService = {
  getPatientTimeline: (patientId: string) =>
    api.get<ApiResponse<any[]>>(`/clinical/timeline/${patientId}`),
};

// ─── Triage & Vitals ─────────────────────────────────────────────────
export const triageService = {
  getQueue: (params?: { status?: string }) =>
    api.get<ApiResponse<any[]>>('/clinical/triage/queue', { params }),

  record: (patientId: string, data: any) =>
    api.post<ApiResponse<any>>(`/clinical/triage/${patientId}`, data),

  recordVitals: (patientId: string, data: any) =>
    api.post<ApiResponse<any>>(`/clinical/vitals/${patientId}`, data),

  getVitals: (patientId: string) =>
    api.get<ApiResponse<any>>(`/clinical/vitals/${patientId}`),

  escalateToDoctor: (data: { patientId: string; reason: string; notes?: string }) =>
    api.post<ApiResponse<any>>('/clinical/triage/escalate', data),
};

// ─── Pharmacy ────────────────────────────────────────────────────────
export const pharmacyService = {
  getPendingPrescriptions: () =>
    api.get<ApiResponse<any[]>>('/clinical/pharmacy/prescriptions'),

  getPrescription: (id: string) =>
    api.get<ApiResponse<any>>(`/clinical/pharmacy/prescriptions/${id}`),

  review: (prescriptionId: string, data: { status: string; notes?: string }) =>
    api.post<ApiResponse<any>>(`/clinical/pharmacy/review/${prescriptionId}`, data),

  dispense: (prescriptionId: string, data: { items?: any[]; counselingNotes?: string }) =>
    api.post<ApiResponse<any>>(`/clinical/pharmacy/dispense/${prescriptionId}`, data),

  getPatientHistory: (patientId: string) =>
    api.get<ApiResponse<any[]>>(`/clinical/pharmacy/history/${patientId}`),
};

// ─── Laboratory ──────────────────────────────────────────────────────
export const labService = {
  getRequests: (params?: { status?: string }) =>
    api.get<ApiResponse<any[]>>('/clinical/lab/requests', { params }),

  collectSample: (requestId: string, data: { sampleType: string; notes?: string }) =>
    api.put<ApiResponse<any>>(`/clinical/lab/collect/${requestId}`, data),

  uploadResult: (requestId: string, data: { tests: any[]; notes?: string }) =>
    api.put<ApiResponse<any>>(`/clinical/lab/result/${requestId}`, data),

  getCritical: () =>
    api.get<ApiResponse<any[]>>('/clinical/lab/critical'),

  getPatientResults: (patientId: string) =>
    api.get<ApiResponse<any[]>>(`/clinical/lab/results/${patientId}`),
};

// ─── Adherence & Counseling ─────────────────────────────────────────
export const counselingService = {
  getPoorAdherencePatients: () =>
    api.get<ApiResponse<any[]>>('/clinical/adherence/patients'),

  createSession: (data: any) =>
    api.post<ApiResponse<any>>('/clinical/adherence/session', data),

  getPatientSessions: (patientId: string) =>
    api.get<ApiResponse<any[]>>(`/clinical/adherence/sessions/${patientId}`),

  updateSession: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/clinical/adherence/session/${id}`, data),
};

// ─── Case Management ────────────────────────────────────────────────
export const caseService = {
  getHighRisk: () =>
    api.get<ApiResponse<any[]>>('/clinical/case/high-risk'),

  open: (data: any) =>
    api.post<ApiResponse<any>>('/clinical/case/open', data),

  getMyCases: (params?: { status?: string }) =>
    api.get<ApiResponse<any[]>>('/clinical/case/mine', { params }),

  getPatient: (patientId: string) =>
    api.get<ApiResponse<any>>(`/clinical/case/${patientId}`),

  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/clinical/case/${id}`, data),

  addIntervention: (id: string, data: any) =>
    api.post<ApiResponse<any>>(`/clinical/case/${id}/intervention`, data),

  createReferral: (data: any) =>
    api.post<ApiResponse<any>>('/clinical/case/referral', data),

  getMyReferrals: () =>
    api.get<ApiResponse<any[]>>('/clinical/case/referrals/mine'),
};

// ─── Staff ───────────────────────────────────────────────────────────
export const staffService = {
  register: (data: any) =>
    api.post<ApiResponse<any>>('/clinical/staff/register', data),

  list: (params?: { role?: string; hospital?: string; department?: string }) =>
    api.get<ApiResponse<any[]>>('/clinical/staff', { params }),

  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/clinical/staff/${id}`, data),

  getMyProfile: () =>
    api.get<ApiResponse<any>>('/clinical/me/profile'),

  updateMyProfile: (data: any) =>
    api.put<ApiResponse<any>>('/clinical/me/profile', data),
};

// ─── Patients ────────────────────────────────────────────────────────
export const patientService = {
  search: (q: string) =>
    api.get<ApiResponse<any[]>>('/clinical/patients/search', { params: { q } }),

  get: (id: string) =>
    api.get<ApiResponse<any>>(`/clinical/patients/${id}`),
};
