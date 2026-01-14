import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FavoriteModelConfig } from '../../../shared/types';

const STORAGE_KEY = 'mindcraft-favorite-models';

interface FavoritesState {
  // State
  favorites: FavoriteModelConfig[];
  loading: boolean;
  error: string | null;

  // Actions
  addFavorite: (favorite: Omit<FavoriteModelConfig, 'id' | 'createdAt'>) => FavoriteModelConfig;
  removeFavorite: (id: string) => void;
  reorderFavorites: (ids: string[]) => void;
  updateFavorite: (id: string, updates: Partial<Omit<FavoriteModelConfig, 'id' | 'createdAt'>>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getFavoriteById: (id: string) => FavoriteModelConfig | undefined;
  getFavoritesByProvider: (provider: string) => FavoriteModelConfig[];
  isFavorite: (modelId: string, provider: string) => boolean;
}

function generateId(): string {
  return `fav_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      // Initial state
      favorites: [],
      loading: false,
      error: null,

      // Actions
      addFavorite: (favoriteData) => {
        const newFavorite: FavoriteModelConfig = {
          ...favoriteData,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({
          favorites: [...state.favorites, newFavorite],
        }));
        return newFavorite;
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((fav) => fav.id !== id),
        }));
      },

      reorderFavorites: (ids) => {
        set((state) => {
          const favoritesMap = new Map(
            state.favorites.map((fav) => [fav.id, fav])
          );
          const reordered: FavoriteModelConfig[] = [];
          
          // Add favorites in the new order
          for (const id of ids) {
            const fav = favoritesMap.get(id);
            if (fav) {
              reordered.push(fav);
              favoritesMap.delete(id);
            }
          }
          
          // Add any remaining favorites that weren't in the ids array
          for (const fav of favoritesMap.values()) {
            reordered.push(fav);
          }
          
          return { favorites: reordered };
        });
      },

      updateFavorite: (id, updates) => {
        set((state) => ({
          favorites: state.favorites.map((fav) =>
            fav.id === id ? { ...fav, ...updates } : fav
          ),
        }));
      },

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      // Computed getters
      getFavoriteById: (id) => {
        const { favorites } = get();
        return favorites.find((fav) => fav.id === id);
      },

      getFavoritesByProvider: (provider) => {
        const { favorites } = get();
        return favorites.filter((fav) => fav.provider === provider);
      },

      isFavorite: (modelId, provider) => {
        const { favorites } = get();
        return favorites.some(
          (fav) => fav.modelId === modelId && fav.provider === provider
        );
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ favorites: state.favorites }),
      // Handle Date serialization/deserialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          if (parsed.state?.favorites) {
            parsed.state.favorites = parsed.state.favorites.map((fav: FavoriteModelConfig) => ({
              ...fav,
              createdAt: new Date(fav.createdAt),
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
