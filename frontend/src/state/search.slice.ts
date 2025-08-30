import { SearchFormHandle, SearchOptions, zSearchOptions } from '../model';
import { SfDatabase, Stamp } from '../api/SfDatabase.ts';
import { StateCreator } from 'zustand';
import { SfDatabaseSlice } from './database.slice.ts';

export interface SearchPageSliceProps {
  database: SfDatabase;
  searchFormHandle: SearchFormHandle;
}

export interface SearchPageSlice {
  searchFormHandle: SearchFormHandle;
  searchOptions: SearchOptions;
  foundStamps: Stamp[];

  setSearchOptions(options: SearchOptions): void;
}

export const createStampSearchSlice: (
  props: SearchPageSliceProps,
) => StateCreator<SfDatabaseSlice & SearchPageSlice, [], [], SearchPageSlice> = (props) => {
  // Build SearchOptions from initial form data
  const initialOptionsResult = zSearchOptions.safeParse(props.searchFormHandle.context.getValues());
  const initialOptions = initialOptionsResult.success ? initialOptionsResult.data : SearchOptions.Default;
  // Initialize slice data
  return (set) => ({
    searchFormHandle: props.searchFormHandle,
    searchOptions: initialOptions,
    foundStamps: initialOptions.filterAndSort(props.database.stamps),
    setSearchOptions: (options: SearchOptions) =>
      set((state) => ({
        searchOptions: options,
        foundStamps: options.filterAndSort(state.database.stamps),
      })),
  });
};
