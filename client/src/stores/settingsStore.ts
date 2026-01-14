import { create } from 'zustand';
import type { ServerSettings } from '../../../shared/types';

const DEFAULT_SETTINGS: ServerSettings = {
  host: 'localhost',
  port: 55916,
  auth: 'offline',
  version: '1.20.4',
  allowInsecureCoding: false,
};

interface SettingsState {
  // State
  settings: ServerSettings;
  loading: boolean;
  error: string | null;
  isDirty: boolean;

  // Actions
  setSettings: (settings: ServerSettings) => void;
  updateSettings: (updates: Partial<ServerSettings>) => void;
  resetSettings: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDirty: (isDirty: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // Initial state
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
  isDirty: false,

  // Actions
  setSettings: (settings) => set({ settings, isDirty: false }),

  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates },
    isDirty: true,
  })),

  resetSettings: () => set({ settings: DEFAULT_SETTINGS, isDirty: false }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  setDirty: (isDirty) => set({ isDirty }),
}));
