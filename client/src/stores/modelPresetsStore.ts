import { create } from 'zustand';
import type { ModelPreset, ModelPresetPurpose } from '../../../shared/types';

interface ModelPresetsState {
  presets: ModelPreset[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setPresets: (presets: ModelPreset[]) => void;
  addPreset: (preset: ModelPreset) => void;
  updatePreset: (id: string, preset: ModelPreset) => void;
  removePreset: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectors
  getPresetsByPurpose: (purpose: ModelPresetPurpose) => ModelPreset[];
  getDefaultPreset: (purpose: ModelPresetPurpose) => ModelPreset | undefined;
  getPresetById: (id: string) => ModelPreset | undefined;
}

export const useModelPresetsStore = create<ModelPresetsState>((set, get) => ({
  presets: [],
  loading: false,
  error: null,

  setPresets: (presets) => set({ presets }),
  
  addPreset: (preset) => set((state) => ({
    presets: [...state.presets, preset],
  })),
  
  updatePreset: (id, preset) => set((state) => ({
    presets: state.presets.map((p) => (p.id === id ? preset : p)),
  })),
  
  removePreset: (id) => set((state) => ({
    presets: state.presets.filter((p) => p.id !== id),
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),

  getPresetsByPurpose: (purpose) => {
    return get().presets.filter((p) => p.purpose === purpose);
  },

  getDefaultPreset: (purpose) => {
    return get().presets.find((p) => p.purpose === purpose && p.isDefault);
  },

  getPresetById: (id) => {
    return get().presets.find((p) => p.id === id);
  },
}));
