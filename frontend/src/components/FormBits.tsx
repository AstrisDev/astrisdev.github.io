import { useAppStore } from '../state/app.store.ts';
import React, { useCallback, useMemo } from 'react';
import { RHFOutlinedInput, RHFSelect, RHFSwitch } from './react-hook-form-mui.tsx';
import { Box, FormControlLabel, InputLabel } from '@mui/material';
import { RangeShortcut } from './RangeShortcutsDropdown.tsx';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { NumberRange } from '../model';
import PhotoSizeSelectActualIcon from '@mui/icons-material/PhotoSizeSelectActual';
import PublicIcon from '@mui/icons-material/Public';
import { RangeSelector } from './RangeSelector.tsx';
import { YearRangeSelector } from './YearRangeSelector.tsx';
import { SortSelector } from './SortSelector.tsx';
import { FieldValues, UseFieldArrayReturn, UseFormReturn } from 'react-hook-form';
import Button from '@mui/material/Button';
import { RestartAlt } from '@mui/icons-material';

const ValueShortcutsComment = 'стоимость с 1 июля 2024';
const ValueRangeShortcuts: RangeShortcut[] = [
  {
    icons: [RestartAltIcon],
    name: 'сбросить',
    range: NumberRange.exact(null),
  },
  {
    icons: [PhotoSizeSelectActualIcon],
    name: 'открытка по России',
    range: NumberRange.exact(24),
  },
  {
    icons: [PublicIcon, PhotoSizeSelectActualIcon],
    name: 'открытка за границу',
    comment: 'Беларусь, Казахстан',
    range: NumberRange.exact(85),
  },
  {
    icons: [PublicIcon, PhotoSizeSelectActualIcon],
    name: 'открытка за границу',
    comment: 'другие страны',
    range: NumberRange.exact(110),
  },
];

export function FormSection(props: { children?: React.ReactNode }) {
  return <Box mb={2}>{props.children}</Box>;
}

export function StampValueSection(props: { path: string }) {
  return (
    <FormSection>
      <RangeSelector
        shortcuts={ValueRangeShortcuts}
        shortcutsComment={ValueShortcutsComment}
        label="Номинал:"
        path={props.path}
        lowerBound={0}
        unit="₽"
      />
    </FormSection>
  );
}

export function StampYearSection(props: { path: string }) {
  const stats = useAppStore((s) => s.database.stats);
  return (
    <FormSection>
      <InputLabel id="year-selector-label">Год выпуска:</InputLabel>
      <YearRangeSelector
        labelId="year-selector-label"
        path={props.path}
        lowerBound={stats.minYear}
        upperBound={stats.maxYear}
      />
    </FormSection>
  );
}

export function StampCategoryChooserSection(props: { path: string }) {
  const categories = useAppStore((s) => s.database.stats.categories);
  const categoriesWithEmpty = useMemo(() => ['', ...categories], [categories]);
  const categoryOptions = useMemo(
    () =>
      categoriesWithEmpty.map((cat) => ({
        value: cat,
        label: cat || '-',
      })),
    [categoriesWithEmpty],
  );
  return (
    <FormSection>
      <InputLabel id="field-category-label">Рубрика:</InputLabel>
      <RHFSelect labelId="field-category-label" path={props.path} values={categoryOptions} />
    </FormSection>
  );
}

export function StampNameSection(props: { path: string }) {
  return (
    <FormSection>
      <InputLabel htmlFor="field-stamp-name-includes">Название содержит:</InputLabel>
      <RHFOutlinedInput id="field-stamp-name-includes" path={props.path} />
    </FormSection>
  );
}

export function StampSortSection(props: { path: string }) {
  return (
    <FormSection>
      <InputLabel id="field-sort-label">Сортировка:</InputLabel>
      <SortSelector labelId="field-sort-label" path={props.path} />
    </FormSection>
  );
}

export function ShopListSection(props: { fieldArray: UseFieldArrayReturn<any, any> }) {
  return (
    <FormSection>
      <InputLabel>Наличие:</InputLabel>
      {props.fieldArray.fields.map((field, index) => (
        <FormControlLabel
          key={field.id}
          control={<RHFSwitch path={`shops.${index}.selected`} />}
          label={(field as unknown as { displayLabel: string }).displayLabel}
        />
      ))}
    </FormSection>
  );
}

export function FormResetButton<Data extends FieldValues>(props: { context: UseFormReturn<Data>; defaultData: Data }) {
  const handleReset = useCallback(() => {
    props.context.reset(props.defaultData as never, {});
  }, [props.defaultData]);
  return (
    <Button variant="outlined" onClick={handleReset} startIcon={<RestartAlt />}>
      Сбросить
    </Button>
  );
}
