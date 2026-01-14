import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CustomEndpoint, ApiFormat } from '../../../shared/types';
import { endpointsApi } from '../api/endpoints';

const STORAGE_KEY = 'mindcraft-custom-endpoints';

interface EndpointsState {
  // State
  endpoints: CustomEndpoint[];
  loading: boolean;
  error: string | null;
  synced: boolean; // Track if synced with server

  // Actions
  addEndpoint: (endpoint: Omit<CustomEndpoint, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomEndpoint>;
  updateEndpoint: (id: string, updates: Partial<Omit<CustomEndpoint, 'id' | 'createdAt'>>) => Promise<void>;
  deleteEndpoint: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  syncToServer: () => Promise<void>;
  loadFromServer: () => Promise<void>;

  // Computed
  getEndpointById: (id: string) => CustomEndpoint | undefined;
  getEndpointsByFormat: (format: ApiFormat) => CustomEndpoint[];
}

function generateId(): string {
  return `ep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useEndpointsStore = create<EndpointsState>()(
  persist(
    (set, get) => ({
      // Initial state
      endpoints: [],
      loading: false,
      error: null,
      synced: false,

      // Actions
      addEndpoint: async (endpointData) => {
        const now = new Date();
        const newEndpoint: CustomEndpoint = {
          ...endpointData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        
        // Add locally first
        set((state) => ({
          endpoints: [...state.endpoints, newEndpoint],
          synced: false,
        }));
        
        // Sync to server
        try {
          const serverEndpoint = await endpointsApi.create({
            name: endpointData.name,
            baseUrl: endpointData.baseUrl,
            apiKey: endpointData.apiKey,
            headers: endpointData.headers,
            apiFormat: endpointData.apiFormat,
          });
          
          // Update with server-generated ID
          set((state) => ({
            endpoints: state.endpoints.map(ep => 
              ep.id === newEndpoint.id ? { ...serverEndpoint, apiKey: endpointData.apiKey } : ep
            ),
            synced: true,
          }));
          
          return { ...serverEndpoint, apiKey: endpointData.apiKey };
        } catch (error) {
          console.error('Failed to sync endpoint to server:', error);
          // Keep local version
          return newEndpoint;
        }
      },

      updateEndpoint: async (id, updates) => {
        // Update locally first
        set((state) => ({
          endpoints: state.endpoints.map((endpoint) =>
            endpoint.id === id
              ? { ...endpoint, ...updates, updatedAt: new Date() }
              : endpoint
          ),
          synced: false,
        }));
        
        // Sync to server
        try {
          await endpointsApi.update(id, updates);
          set({ synced: true });
        } catch (error) {
          console.error('Failed to sync endpoint update to server:', error);
        }
      },

      deleteEndpoint: async (id) => {
        // Delete locally first
        set((state) => ({
          endpoints: state.endpoints.filter((endpoint) => endpoint.id !== id),
          synced: false,
        }));
        
        // Sync to server
        try {
          await endpointsApi.delete(id);
          set({ synced: true });
        } catch (error) {
          console.error('Failed to sync endpoint deletion to server:', error);
        }
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),
      
      // Sync all local endpoints to server
      syncToServer: async () => {
        const { endpoints } = get();
        set({ loading: true, error: null });
        
        try {
          for (const endpoint of endpoints) {
            try {
              await endpointsApi.create({
                name: endpoint.name,
                baseUrl: endpoint.baseUrl,
                apiKey: endpoint.apiKey,
                headers: endpoint.headers,
                apiFormat: endpoint.apiFormat,
              });
            } catch (error) {
              // Endpoint might already exist, try update
              try {
                await endpointsApi.update(endpoint.id, {
                  name: endpoint.name,
                  baseUrl: endpoint.baseUrl,
                  apiKey: endpoint.apiKey,
                  headers: endpoint.headers,
                  apiFormat: endpoint.apiFormat,
                });
              } catch {
                console.error('Failed to sync endpoint:', endpoint.id);
              }
            }
          }
          set({ synced: true, loading: false });
        } catch (error) {
          set({ error: 'Failed to sync endpoints', loading: false });
        }
      },
      
      // Load endpoints from server
      loadFromServer: async () => {
        set({ loading: true, error: null });
        try {
          const serverEndpoints = await endpointsApi.getAll();
          // Merge with local endpoints (local takes precedence for API keys)
          const { endpoints: localEndpoints } = get();
          const merged = serverEndpoints.map(serverEp => {
            const localEp = localEndpoints.find(l => l.id === serverEp.id);
            return localEp ? { ...serverEp, apiKey: localEp.apiKey } : serverEp;
          });
          set({ endpoints: merged, synced: true, loading: false });
        } catch (error) {
          set({ error: 'Failed to load endpoints from server', loading: false });
        }
      },

      // Computed getters
      getEndpointById: (id) => {
        const { endpoints } = get();
        return endpoints.find((endpoint) => endpoint.id === id);
      },

      getEndpointsByFormat: (format) => {
        const { endpoints } = get();
        return endpoints.filter((endpoint) => endpoint.apiFormat === format);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ endpoints: state.endpoints }),
      // Handle Date serialization/deserialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          if (parsed.state?.endpoints) {
            parsed.state.endpoints = parsed.state.endpoints.map((ep: CustomEndpoint) => ({
              ...ep,
              createdAt: new Date(ep.createdAt),
              updatedAt: new Date(ep.updatedAt),
            }));
          }
          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
