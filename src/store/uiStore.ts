import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AccentColor = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal' | 'indigo' | 'pink';

export interface BadgeCounts {
  unreadNotifications: number;
  pendingWelfare: number;
  pendingTransactions: number;
  pendingApprovals: number;
}

interface UIState {
  sidebarOpen: boolean;
  theme: ThemeMode;
  accentColor: AccentColor;
  expandedItems: string[];
  badgeCounts: BadgeCounts;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  toggleExpanded: (id: string) => void;
  setExpanded: (id: string, open: boolean) => void;
  setBadgeCounts: (counts: Partial<BadgeCounts>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'system',
      accentColor: 'blue',
      expandedItems: [],
      badgeCounts: { unreadNotifications: 0, pendingWelfare: 0, pendingTransactions: 0, pendingApprovals: 0 },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      toggleExpanded: (id) => set((s) => ({
        expandedItems: s.expandedItems.includes(id) ? [] : [id],
      })),
      setExpanded: (id, open) => set((s) => ({
        expandedItems: open
          ? [...s.expandedItems.filter(i => i !== id), id]
          : s.expandedItems.filter(i => i !== id),
      })),
      setBadgeCounts: (counts) => set((s) => ({ badgeCounts: { ...s.badgeCounts, ...counts } })),
    }),
    {
      name: 'voa_ui',
      partialize: (s) => ({ sidebarOpen: s.sidebarOpen, theme: s.theme, accentColor: s.accentColor }),
      merge: (persisted, current) => {
        const p = persisted as Record<string, unknown> & { state?: Record<string, unknown> };
        const state = p.state || p;
        if ('darkMode' in state && !('theme' in state)) {
          const oldDark = state.darkMode as boolean;
          return { ...current, ...state, theme: oldDark ? 'dark' : 'system', darkMode: undefined };
        }
        return { ...current, ...state };
      },
    }
  )
);
