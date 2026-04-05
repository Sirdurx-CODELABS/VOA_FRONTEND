import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hydrated: boolean;           // ← tracks when persist has finished loading
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hydrated: false,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') localStorage.setItem('voa_token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('voa_token');
          localStorage.removeItem('voa_user');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'voa_auth',
      storage: createJSONStorage(() => localStorage),
      // Called once rehydration from localStorage is complete
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
