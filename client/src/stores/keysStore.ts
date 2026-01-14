import { create } from 'zustand';
import type { APIKeyStatus } from '../../../shared/types';

interface KeysState {
  // State
  keys: APIKeyStatus[];
  loading: boolean;
  error: string | null;

  // Actions
  setKeys: (keys: APIKeyStatus[]) => void;
  updateKeyStatus: (provider: string, configured: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  isKeyConfigured: (provider: string) => boolean;
  getConfiguredCount: () => number;
  getMissingCount: () => number;
}

export const useKeysStore = create<KeysState>((set, get) => ({
  // Initial state
  keys: [],
  loading: false,
  error: null,

  // Actions
  setKeys: (keys) => set({ keys }),

  updateKeyStatus: (provider, configured) => set((state) => ({
    keys: state.keys.map((key) =>
      key.provider === provider ? { ...key, configured } : key
    ),
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  // Computed getters
  isKeyConfigured: (provider) => {
    const { keys } = get();
    const key = keys.find((k) => k.provider === provider);
    return key?.configured ?? false;
  },

  getConfiguredCount: () => {
    const { keys } = get();
    return keys.filter((k) => k.configured).length;
  },

  getMissingCount: () => {
    const { keys } = get();
    return keys.filter((k) => !k.configured).length;
  },
}));
