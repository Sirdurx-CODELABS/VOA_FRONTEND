import { create } from 'zustand';
import { clinicalService } from '@/services/clinical.service';
import { getSocket } from '@/services/socket.service';
import type { PatientVisit, WorkflowStatus } from '@/types';

interface WorkflowState {
  activeVisits: PatientVisit[];
  waitingQueue: PatientVisit[];
  doctorQueue: PatientVisit[];
  loading: boolean;
  error: string | null;
  socketInitialized: boolean;

  fetchActiveVisits: (params?: Record<string, string>) => Promise<void>;
  fetchWaitingQueue: (params?: Record<string, string>) => Promise<void>;
  fetchDoctorQueue: () => Promise<void>;
  fetchVisitById: (id: string) => Promise<PatientVisit | null>;
  checkInPatient: (data: Record<string, unknown>) => Promise<PatientVisit>;
  transitionVisit: (visitId: string, data: Record<string, unknown>) => Promise<void>;
  startConsultation: (visitId: string) => Promise<void>;
  dischargePatient: (visitId: string, data: Record<string, unknown>) => Promise<void>;
  initSocketListener: () => void;
  destroySocketListener: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  activeVisits: [],
  waitingQueue: [],
  doctorQueue: [],
  loading: false,
  error: null,
  socketInitialized: false,

  fetchActiveVisits: async (params) => {
    set({ loading: true, error: null });
    try {
      const res = await clinicalService.getActiveWorkflowVisits(params);
      set({ activeVisits: res.data?.data || [], loading: false });
    } catch {
      set({ error: 'Failed to fetch visits', loading: false });
    }
  },

  fetchWaitingQueue: async (params) => {
    try {
      const res = await clinicalService.getWorkflowQueue({ status: params?.status || 'checked_in,triaged' });
      set({ waitingQueue: res.data?.data || [] });
    } catch { /* ignore */ }
  },

  fetchDoctorQueue: async () => {
    try {
      const res = await clinicalService.getWorkflowDoctorQueue();
      set({ doctorQueue: res.data?.data || [] });
    } catch { /* ignore */ }
  },

  fetchVisitById: async (id) => {
    try {
      const res = await clinicalService.getWorkflowVisitById(id);
      return res.data?.data || null;
    } catch { return null; }
  },

  checkInPatient: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await clinicalService.checkInPatient(data);
      const visit: PatientVisit = res.data?.data;
      set((s) => ({ activeVisits: [visit, ...s.activeVisits], loading: false }));
      return visit;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Check-in failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  transitionVisit: async (visitId, data) => {
    try {
      const res = await clinicalService.transitionWorkflowVisit(visitId, data);
      const updated: PatientVisit = res.data?.data;
      set((s) => ({
        activeVisits: s.activeVisits.map((v) => (v._id === visitId ? { ...v, ...updated } : v)),
        waitingQueue: s.waitingQueue.map((v) => (v._id === visitId ? { ...v, ...updated } : v)),
        doctorQueue: s.doctorQueue.map((v) => (v._id === visitId ? { ...v, ...updated } : v)),
      }));
    } catch { /* ignore */ }
  },

  startConsultation: async (visitId) => {
    try {
      const res = await clinicalService.startVisitConsultation(visitId);
      const updated: PatientVisit = res.data?.data;
      set((s) => ({
        activeVisits: s.activeVisits.map((v) => (v._id === visitId ? { ...v, ...updated } : v)),
        doctorQueue: s.doctorQueue.map((v) => (v._id === visitId ? { ...v, ...updated } : v)),
        waitingQueue: s.waitingQueue.filter((v) => v._id !== visitId),
      }));
    } catch { /* ignore */ }
  },

  dischargePatient: async (visitId, data) => {
    try {
      const res = await clinicalService.dischargePatient(visitId, data);
      const updated: PatientVisit = res.data?.data;
      set((s) => ({
        activeVisits: s.activeVisits.map((v) => (v._id === visitId ? { ...v, ...updated } : v)),
        doctorQueue: s.doctorQueue.filter((v) => v._id !== visitId),
        waitingQueue: s.waitingQueue.filter((v) => v._id !== visitId),
      }));
    } catch { /* ignore */ }
  },

  initSocketListener: () => {
    const socket = getSocket();
    if (!socket || get().socketInitialized) return;
    set({ socketInitialized: true });

    socket.on('workflow:visit:created', (visit: PatientVisit) => {
      set((s) => ({
        activeVisits: [visit, ...s.activeVisits],
        waitingQueue: (visit.status === 'checked_in' || visit.status === 'triaged')
          ? [visit, ...s.waitingQueue] : s.waitingQueue,
      }));
    });

    socket.on('workflow:visit:updated', (updated: PatientVisit) => {
      set((s) => ({
        activeVisits: s.activeVisits.map((v) => (v._id === updated._id ? updated : v)),
        waitingQueue: s.waitingQueue.map((v) => (v._id === updated._id ? updated : v)),
        doctorQueue: s.doctorQueue.map((v) => (v._id === updated._id ? updated : v)),
      }));
    });

    socket.on('workflow:visit:removed', (visitId: string) => {
      set((s) => ({
        activeVisits: s.activeVisits.filter((v) => v._id !== visitId),
        waitingQueue: s.waitingQueue.filter((v) => v._id !== visitId),
        doctorQueue: s.doctorQueue.filter((v) => v._id !== visitId),
      }));
    });

    socket.on('workflow:queue:refresh', () => {
      get().fetchActiveVisits();
      get().fetchWaitingQueue();
      get().fetchDoctorQueue();
    });
  },

  destroySocketListener: () => {
    const socket = getSocket();
    if (!socket) return;
    socket.off('workflow:visit:created');
    socket.off('workflow:visit:updated');
    socket.off('workflow:visit:removed');
    socket.off('workflow:queue:refresh');
    set({ socketInitialized: false });
  },
}));
