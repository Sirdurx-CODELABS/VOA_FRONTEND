import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Organization } from '@/types';

export type PortalType = 'org' | 'hms' | null;

interface AuthState {
  user: User | null;
  token: string | null;
  portal: PortalType;
  organization: Organization | null;
  staffProfile: any | null;
  voaProfile: any | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  setAuth: (user: User, token: string, portal?: PortalType, organization?: Organization | null, staffProfile?: any, voaProfile?: any) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  updateOrganization: (org: Partial<Organization>) => void;
  updateStaffProfile: (profile: any) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      portal: null,
      organization: null,
      staffProfile: null,
      voaProfile: null,
      isAuthenticated: false,
      _hydrated: false,
      setAuth: (user, token, portal = null, organization = null, staffProfile = null, voaProfile = null) => {
        set({ user, token, portal, organization, staffProfile, voaProfile, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, token: null, portal: null, organization: null, staffProfile: null, voaProfile: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
      updateOrganization: (updates) =>
        set((state) => ({ organization: state.organization ? { ...state.organization, ...updates } : null })),
      updateStaffProfile: (profile) =>
        set({ staffProfile: profile }),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: 'voa_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        portal: state.portal,
        organization: state.organization,
        staffProfile: state.staffProfile,
        voaProfile: state.voaProfile,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);