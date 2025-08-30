import { createJSONStorage, persist } from 'zustand/middleware';
import { Stamp } from '../api/SfDatabase.ts';
import { create } from 'zustand';
import { useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'favorites';

export interface FavoritesStore {
  favorites: Record<number, boolean | undefined>;
  isFavorite: (stampId: number) => boolean;
  setFavorite: (stampId: number, isFavorite: boolean) => void;
  filterFavorites: (stamps: Stamp[]) => Stamp[];
}

export const useFavoritesStore = create(
  persist<FavoritesStore>(
    (set, get) => ({
      favorites: {},
      isFavorite: (stampId: number): boolean => {
        return get().favorites[stampId] ?? false;
      },
      setFavorite: (stampId: number, isFavorite: boolean) => {
        set((old) => {
          const newFavorites = { ...old.favorites };
          if (isFavorite) {
            newFavorites[stampId] = true;
          } else {
            delete newFavorites[stampId];
          }
          return { favorites: newFavorites };
        });
      },
      filterFavorites: (stamps: Stamp[]) => {
        return stamps.filter((s) => get().isFavorite(s.id));
      },
    }),
    {
      name: LOCAL_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useFavoritesStoreSyncBetweenTabs() {
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY) {
        useFavoritesStore.persist.rehydrate();
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);
}
