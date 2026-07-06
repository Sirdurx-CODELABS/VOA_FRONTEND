import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Organization } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  setAuth: (user: User, token: string, organization?: Organization | null) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateOrganization: (org: Partial<Organization>) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      organization: null,
      isAuthenticated: false,
      _hydrated: false,
      setAuth: (user, token, organization = null) => {
        if (typeof window !== 'undefined') localStorage.setItem('voa_token', token);
        set({ user, token, organization, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('voa_token');
          localStorage.removeItem('voa_user');
        }
        set({ user: null, token: null, organization: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      updateOrganization: (updates) =>
        set((state) => ({ organization: state.organization ? { ...state.organization, ...updates } : null })),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'voa_auth',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
