'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Doctor } from '@/types';

interface DoctorAuthState {
  doctor: Doctor | null;
  token: string | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  setAuth: (doctor: Doctor, token: string) => void;
  logout: () => void;
  updateDoctor: (updates: Partial<Doctor>) => void;
  setHydrated: () => void;
}

export const useDoctorAuthStore = create<DoctorAuthState>()(
  persist(
    (set) => ({
      doctor: null,
      token: null,
      isAuthenticated: false,
      _hydrated: false,
      setAuth: (doctor, token) => {
        if (typeof window !== 'undefined') localStorage.setItem('doctor_token', token);
        set({ doctor, token, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('doctor_token');
          localStorage.removeItem('doctor_user');
        }
        set({ doctor: null, token: null, isAuthenticated: false });
      },
      updateDoctor: (updates) =>
        set((state) => ({ doctor: state.doctor ? { ...state.doctor, ...updates } : null })),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'voa_doctor_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        doctor: state.doctor,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
