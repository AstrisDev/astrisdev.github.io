import { MenuItem, OutlinedInput, Select, Switch } from '@mui/material';
import React, { HTMLAttributes } from 'react';
import { Controller, FieldPathByValue, FieldValues, useFormContext } from 'react-hook-form';

export function RHFOutlinedInput<TFormData extends FieldValues>(props: {
  id?: string;
  path: FieldPathByValue<TFormData, string>;
  inputMode?: HTMLAttributes<unknown>['inputMode'];
  pattern?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}): React.ReactElement {
  const handle = useFormContext();
  return (
    <Controller
      name={props.path}
      control={handle.control}
      render={({ field, fieldState }) => {
        return (
          <OutlinedInput
            {...field}
            id={props.id}
            inputRef={field.ref}
            fullWidth
            size="small"
            type="text"
            inputProps={{ inputMode: props.inputMode, pattern: props.pattern }}
            error={fieldState.invalid}
            startAdornment={props.startAdornment}
            endAdornment={props.endAdornment}
          />
        );
      }}
    />
  );
}

export function RHFSwitch<TFormData extends FieldValues>(props: {
  path: FieldPathByValue<TFormData, boolean>;
}): React.ReactElement {
  const context = useFormContext();
  return (
    <Controller
      name={props.path}
      control={context.control}
      render={({ field }) => {
        return <Switch {...field} inputRef={field.ref} checked={!!field.value} size="small" />;
      }}
    />
  );
}

export function RHFSelect(props: {
  labelId?: string;
  path: string;
  values: { value: string; label: string }[];
}): React.ReactElement {
  const context = useFormContext();
  return (
    <Controller
      control={context.control}
      name={props.path}
      render={({ field, fieldState }) => (
        <Select
          {...field}
          labelId={props.labelId}
          inputRef={field.ref}
          error={fieldState.invalid}
          size="small"
          fullWidth
        >
          {props.values.map(({ value, label }) => (
            <MenuItem key={value || '-'} value={value}>
              {label}
            </MenuItem>
          ))}
        </Select>
      )}
    />
  );
}
