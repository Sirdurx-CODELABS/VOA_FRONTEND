'use client';
import axios from 'axios';
import {
  Doctor, Consultation, PatientProfile, Prescription, LabRequest,
  Referral, MedicalRecord, Message, Appointment, DashboardStats,
  NotificationItem, AiRecommendation, Vitals, HIVRecord,
} from '@/types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
const doctorApi = axios.create({
  baseURL: `${API_BASE}/api/ai`,
  headers: { 'Content-Type': 'application/json' },
});

doctorApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('doctor_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

doctorApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('doctor_token');
      localStorage.removeItem('doctor_user');
    }
    return Promise.reject(err);
  }
);

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Auth ──────────────────────────────────────────────────────────────
export const doctorAuthService = {
  login: (identifier: string, password: string) =>
    doctorApi.post<ApiResponse<{ token: string; doctor: Doctor }>>('/doctor/login', { identifier, password }),

  register: (data: Partial<Doctor> & { password: string }) =>
    doctorApi.post<ApiResponse<{ id: string; name: string; phone: string; email: string }>>('/doctor/register', data),
};

// ─── Doctor Profile ────────────────────────────────────────────────────
export const doctorService = {
  getProfile: () =>
    doctorApi.get<ApiResponse<Doctor>>('/doctor/me'),

  updateProfile: (id: string, data: Partial<Doctor>) =>
    doctorApi.put<ApiResponse<Doctor>>(`/doctor/${id}`, data),

  toggleAvailability: (id: string, isAvailable: boolean) =>
    doctorApi.patch<ApiResponse<Doctor>>(`/doctor/${id}/availability`, { isAvailable }),

  getConsultations: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return doctorApi.get<ApiResponse<Consultation[]>>(`/doctor/consultations${params}`);
  },

  getDashboardStats: () =>
    doctorApi.get<ApiResponse<DashboardStats>>('/doctor/stats'),

  getDoctor: (id: string) =>
    doctorApi.get<ApiResponse<Doctor>>(`/doctor/${id}`),
};

// ─── Patients ──────────────────────────────────────────────────────────
export const patientService = {
  search: (query: string) =>
    doctorApi.get<PaginatedResponse<PatientProfile>>(`/patient/search?q=${encodeURIComponent(query)}`),

  register: (data: Partial<PatientProfile>) =>
    doctorApi.post<ApiResponse<PatientProfile>>('/patient/register', data),

  getById: (id: string) =>
    doctorApi.get<ApiResponse<PatientProfile>>(`/patient/${id}`),

  getByPhone: (phone: string) =>
    doctorApi.get<ApiResponse<PatientProfile>>(`/patient/phone/${encodeURIComponent(phone)}`),

  update: (id: string, data: Partial<PatientProfile>) =>
    doctorApi.put<ApiResponse<PatientProfile>>(`/patient/${id}`, data),

  getVitals: (patientId: string) =>
    doctorApi.get<ApiResponse<Vitals>>(`/patient/${patientId}/vitals`),

  updateVitals: (patientId: string, data: Partial<Vitals>) =>
    doctorApi.put<ApiResponse<Vitals>>(`/patient/${patientId}/vitals`, data),
};

// ─── Consultation ──────────────────────────────────────────────────────
export const consultationService = {
  accept: (consultationId: string) =>
    doctorApi.post<ApiResponse<Consultation>>('/consultation/accept', { consultationId }),

  reject: (consultationId: string) =>
    doctorApi.post<ApiResponse<Consultation>>('/consultation/reject', { consultationId }),

  start: (consultationId: string) =>
    doctorApi.post<ApiResponse<Consultation>>('/consultation/start', { consultationId }),

  end: (consultationId: string, data: { notes?: string; prescription?: string; labRequests?: string }) =>
    doctorApi.post<ApiResponse<Consultation>>('/consultation/end', { consultationId, ...data }),

  getById: (id: string) =>
    doctorApi.get<ApiResponse<Consultation>>(`/consultation/${id}`),

  getByPatient: (patientId: string) =>
    doctorApi.get<ApiResponse<Consultation[]>>(`/consultations?patient=${patientId}`),

  getAiRecommendation: (consultationId: string) =>
    doctorApi.get<ApiResponse<AiRecommendation>>(`/consultation/${consultationId}/ai-recommendation`),

  requestAiAnalysis: (data: { consultationId: string; symptoms: string; notes?: string }) =>
    doctorApi.post<ApiResponse<AiRecommendation>>('/consultation/ai-analyze', data),
};

// ─── Prescriptions ─────────────────────────────────────────────────────
export const prescriptionService = {
  create: (data: Partial<Prescription>) =>
    doctorApi.post<ApiResponse<Prescription>>('/prescription', data),

  getAll: (patientId?: string) => {
    const params = patientId ? `?patient=${patientId}` : '';
    return doctorApi.get<PaginatedResponse<Prescription>>(`/prescriptions${params}`);
  },

  getById: (id: string) =>
    doctorApi.get<ApiResponse<Prescription>>(`/prescription/${id}`),

  update: (id: string, data: Partial<Prescription>) =>
    doctorApi.put<ApiResponse<Prescription>>(`/prescription/${id}`, data),

  delete: (id: string) =>
    doctorApi.delete<ApiResponse<null>>(`/prescription/${id}`),

  sendToPatient: (id: string) =>
    doctorApi.post<ApiResponse<Prescription>>(`/prescription/${id}/send`, {}),
};

// ─── Lab Requests ──────────────────────────────────────────────────────
export const labService = {
  create: (data: Partial<LabRequest>) =>
    doctorApi.post<ApiResponse<LabRequest>>('/lab-request', data),

  getAll: (patientId?: string) => {
    const params = patientId ? `?patient=${patientId}` : '';
    return doctorApi.get<PaginatedResponse<LabRequest>>(`/lab-requests${params}`);
  },

  getById: (id: string) =>
    doctorApi.get<ApiResponse<LabRequest>>(`/lab-request/${id}`),

  update: (id: string, data: Partial<LabRequest>) =>
    doctorApi.put<ApiResponse<LabRequest>>(`/lab-request/${id}`, data),
};

// ─── Referrals ─────────────────────────────────────────────────────────
export const referralService = {
  create: (data: Partial<Referral>) =>
    doctorApi.post<ApiResponse<Referral>>('/referral', data),

  getAll: (patientId?: string) => {
    const params = patientId ? `?patient=${patientId}` : '';
    return doctorApi.get<PaginatedResponse<Referral>>(`/referrals${params}`);
  },

  getById: (id: string) =>
    doctorApi.get<ApiResponse<Referral>>(`/referral/${id}`),

  updateStatus: (id: string, status: string) =>
    doctorApi.patch<ApiResponse<Referral>>(`/referral/${id}/status`, { status }),
};

// ─── Medical Records ───────────────────────────────────────────────────
export const medicalRecordService = {
  getByPatient: (patientId: string) =>
    doctorApi.get<PaginatedResponse<MedicalRecord>>(`/patient/${patientId}/medical-records`),

  create: (data: Partial<MedicalRecord>) =>
    doctorApi.post<ApiResponse<MedicalRecord>>('/medical-record', data),
};

// ─── Messages ──────────────────────────────────────────────────────────
export const messageService = {
  getConversations: () =>
    doctorApi.get<PaginatedResponse<Message>>('/messages'),

  getConversation: (otherUserId: string) =>
    doctorApi.get<PaginatedResponse<Message>>(`/messages/conversation/${otherUserId}`),

  send: (data: { recipientId: string; recipientRole: string; subject: string; content: string; consultation?: string }) =>
    doctorApi.post<ApiResponse<Message>>('/messages/send', data),

  markAsRead: (messageId: string) =>
    doctorApi.patch<ApiResponse<Message>>(`/messages/${messageId}/read`, {}),

  getUnreadCount: () =>
    doctorApi.get<ApiResponse<{ count: number }>>('/messages/unread-count'),
};

// ─── Appointments ──────────────────────────────────────────────────────
export const appointmentService = {
  getAll: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return doctorApi.get<PaginatedResponse<Appointment>>(`/appointments${params}`);
  },

  create: (data: Partial<Appointment>) =>
    doctorApi.post<ApiResponse<Appointment>>('/appointment', data),

  updateStatus: (id: string, status: string) =>
    doctorApi.patch<ApiResponse<Appointment>>(`/appointment/${id}/status`, { status }),
};

// ─── Notifications ─────────────────────────────────────────────────────
export const notificationService = {
  getAll: () =>
    doctorApi.get<PaginatedResponse<NotificationItem>>('/notifications'),

  markAsRead: (id: string) =>
    doctorApi.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    doctorApi.post<ApiResponse<null>>('/notifications/mark-all-read', {}),

  getUnreadCount: () =>
    doctorApi.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
};

// ─── Hospital ──────────────────────────────────────────────────────────
export const hospitalService = {
  getAll: (params?: Record<string, string>) =>
    doctorApi.get<PaginatedResponse<{ _id: string; name: string; state: string; lga: string; address?: string; phone?: string }>>('/hospitals', { params }),

  getById: (id: string) =>
    doctorApi.get<ApiResponse<{ _id: string; name: string; state: string; lga: string; address?: string; phone?: string }>>(`/hospital/${id}`),

  getDoctors: (id: string) =>
    doctorApi.get<ApiResponse<Doctor[]>>(`/hospital/${id}/doctors`),
};

// ─── Analytics ─────────────────────────────────────────────────────────
export const analyticsService = {
  getWeeklyConsultations: () =>
    doctorApi.get<ApiResponse<{ labels: string[]; data: number[] }>>('/analytics/weekly-consultations'),

  getMonthlyConsultations: () =>
    doctorApi.get<ApiResponse<{ labels: string[]; data: number[] }>>('/analytics/monthly-consultations'),

  getPatientDemographics: () =>
    doctorApi.get<ApiResponse<{ labels: string[]; data: number[] }>>('/analytics/patient-demographics'),

  getConsultationTypes: () =>
    doctorApi.get<ApiResponse<{ labels: string[]; data: number[] }>>('/analytics/consultation-types'),

  getCommonDiseases: () =>
    doctorApi.get<ApiResponse<{ labels: string[]; data: number[] }>>('/analytics/common-diseases'),

  getRevenueAnalytics: () =>
    doctorApi.get<ApiResponse<{ daily: number[]; monthly: number[]; labels: string[] }>>('/analytics/revenue'),
};

// ─── Search ────────────────────────────────────────────────────────────
export const searchService = {
  global: (query: string) =>
    doctorApi.get<ApiResponse<{
      patients: PatientProfile[];
      consultations: Consultation[];
      prescriptions: Prescription[];
    }>>(`/search?q=${encodeURIComponent(query)}`),
};

// ─── HIV Clinical Care ───────────────────────────────────────────────
export const hivService = {
  getRecord: (patientId: string) =>
    doctorApi.get<ApiResponse<HIVRecord>>(`/hiv/record/${patientId}`),

  updateRecord: (patientId: string, data: Partial<HIVRecord>) =>
    doctorApi.put<ApiResponse<HIVRecord>>(`/hiv/record/${patientId}`, data),

  addViralLoad: (patientId: string, data: { value: number; collectionDate: string; status: string; notes?: string }) =>
    doctorApi.post<ApiResponse<HIVRecord>>(`/hiv/viral-load/${patientId}`, data),

  addCD4: (patientId: string, data: { value: number; date: string; percentage?: number; notes?: string }) =>
    doctorApi.post<ApiResponse<HIVRecord>>(`/hiv/cd4/${patientId}`, data),

  addRegimen: (patientId: string, data: { regimen: string; startDate: string; lineOfTreatment: string }) =>
    doctorApi.post<ApiResponse<HIVRecord>>(`/hiv/regimen/${patientId}`, data),

  addOI: (patientId: string, data: { name: string; type: string; diagnosisDate?: string; notes?: string }) =>
    doctorApi.post<ApiResponse<HIVRecord>>(`/hiv/oi/${patientId}`, data),

  addMedication: (patientId: string, data: { name: string; type: string; dosage?: string; frequency?: string; startDate?: string }) =>
    doctorApi.post<ApiResponse<HIVRecord>>(`/hiv/medication/${patientId}`, data),

  addLabResult: (patientId: string, data: { testType: string; testName: string; value?: string; unit?: string; referenceRange?: string; date: string }) =>
    doctorApi.post<ApiResponse<HIVRecord>>(`/hiv/lab-result/${patientId}`, data),

  requestAiAnalysis: (data: { patientId: string; consultationId?: string; symptoms?: string; notes?: string }) =>
    doctorApi.post<ApiResponse<{ analysis: string; provider: string; hivContext: unknown }>>('/hiv/ai-analyze', data),
};

// ─── Reference Data ──────────────────────────────────────────────────
export const referenceService = {
  getStates: () =>
    doctorApi.get<ApiResponse<string[]>>('/reference/states'),

  getLGAs: (state: string) =>
    doctorApi.get<ApiResponse<string[]>>(`/reference/lgas/${encodeURIComponent(state)}`),

  getSpecializations: () =>
    doctorApi.get<ApiResponse<string[]>>('/reference/specializations'),

  getDepartments: () =>
    doctorApi.get<ApiResponse<string[]>>('/reference/departments'),
};
