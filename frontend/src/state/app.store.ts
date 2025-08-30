import { createStore, useStore } from 'zustand';
import { createContext, useContext } from 'react';
import { createSfDatabaseSlice, SfDatabaseSlice, SfDatabaseSliceProps } from './database.slice.ts';
import { createStampSearchSlice, SearchPageSlice, SearchPageSliceProps } from './search.slice.ts';

export const createAppStore = (initProps: SearchPageSliceProps & SfDatabaseSliceProps) => {
  return createStore<SfDatabaseSlice & SearchPageSlice>((...a) => ({
    ...createSfDatabaseSlice(initProps)(...a),
    ...createStampSearchSlice(initProps)(...a),
  }));
};

export type AppStore = ReturnType<typeof createAppStore>;
export type AppState = ReturnType<AppStore['getState']>;
export const AppStoreContext = createContext<AppStore | null>(null);

export const useAppStore = <T>(selector: (state: AppState) => T): T => {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('Missing AppStoreContext.Provider in the tree');
  return useStore(store, selector);
};
