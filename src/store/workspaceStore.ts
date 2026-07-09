import { create } from 'zustand';

export type WorkspaceType = 'global' | 'hospital' | 'organisation';

export interface WorkspaceEntity {
  _id: string;
  name: string;
  type: 'hospital' | 'organisation';
  logoUrl?: string;
}

interface WorkspaceState {
  type: WorkspaceType;
  entity: WorkspaceEntity | null;
  setGlobal: () => void;
  setHospital: (entity: WorkspaceEntity) => void;
  setOrganisation: (entity: WorkspaceEntity) => void;
  clearWorkspace: () => void;
  getEntityId: () => string | null;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  type: 'global',
  entity: null,

  setGlobal: () => set({ type: 'global', entity: null }),

  setHospital: (entity) => set({ type: 'hospital', entity }),

  setOrganisation: (entity) => set({ type: 'organisation', entity }),

  clearWorkspace: () => set({ type: 'global', entity: null }),

  getEntityId: () => get().entity?._id || null,
}));
