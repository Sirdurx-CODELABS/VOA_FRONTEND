import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BadgeCounts {
  unreadNotifications: number;
  pendingWelfare: number;
  pendingTransactions: number;
  pendingApprovals: number;
}

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  expandedItems: string[];          // IDs of expanded submenu items
  badgeCounts: BadgeCounts;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  toggleDarkMode: () => void;
  toggleExpanded: (id: string) => void;
  setExpanded: (id: string, open: boolean) => void;
  setBadgeCounts: (counts: Partial<BadgeCounts>) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      darkMode: false,
      expandedItems: [],
      badgeCounts: { unreadNotifications: 0, pendingWelfare: 0, pendingTransactions: 0, pendingApprovals: 0 },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebar: (open) => set({ sidebarOpen: open }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      toggleExpanded: (id) => set((s) => ({
        expandedItems: s.expandedItems.includes(id)
          ? s.expandedItems.filter(i => i !== id)
          : [...s.expandedItems, id],
      })),
      setExpanded: (id, open) => set((s) => ({
        expandedItems: open
          ? [...s.expandedItems.filter(i => i !== id), id]
          : s.expandedItems.filter(i => i !== id),
      })),
      setBadgeCounts: (counts) => set((s) => ({ badgeCounts: { ...s.badgeCounts, ...counts } })),
    }),
    { name: 'voa_ui', partialize: (s) => ({ sidebarOpen: s.sidebarOpen, darkMode: s.darkMode }) }
  )
);
