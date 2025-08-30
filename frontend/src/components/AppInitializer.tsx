import { SfDatabase } from '../api/SfDatabase.ts';
import { ReactNode, useMemo } from 'react';
import { SearchOptions, useSearchOptionsForm, zSearchOptions } from '../model';
import { AppStoreContext, createAppStore } from '../state/app.store.ts';
import { useFavoritesStoreSyncBetweenTabs } from '../state/favorites.store.ts';
import { useStore } from 'zustand';

export const AppInitializer = (props: { database: SfDatabase; children: ReactNode }): ReactNode => {
  // Initialize search form state
  const initialSearchOptions = useMemo(
    () => SearchOptions.fromUrlParams(new URLSearchParams(document.location.search)),
    [],
  );
  const searchFormHandle = useSearchOptionsForm(props.database, initialSearchOptions);

  // Synchronize favorites with other tabs
  useFavoritesStoreSyncBetweenTabs();

  // Create the global store
  const appStore = useMemo(
    () =>
      createAppStore({
        database: props.database,
        searchFormHandle: searchFormHandle,
      }),
    [],
  );

  // Sync search form data and searchOptions
  const setSearchOptions = useStore(appStore, (s) => s.setSearchOptions);
  searchFormHandle.context.watch((value) => {
    const parsedOptions = zSearchOptions.safeParse(value);
    if (parsedOptions.success) {
      setSearchOptions(parsedOptions.data);
    }
  });

  return <AppStoreContext.Provider value={appStore}>{props.children}</AppStoreContext.Provider>;
};
