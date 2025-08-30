import { SfDatabase } from '../api/SfDatabase.ts';
import { StateCreator } from 'zustand';

export interface SfDatabaseSliceProps {
  database: SfDatabase;
}

export interface SfDatabaseSlice {
  database: SfDatabase;
}

export const createSfDatabaseSlice: (
  props: SfDatabaseSliceProps,
) => StateCreator<SfDatabaseSlice, [], [], SfDatabaseSlice> = (props: SfDatabaseSliceProps) => () => ({
  database: props.database,
});
