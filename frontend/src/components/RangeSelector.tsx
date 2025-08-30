import { Box, InputAdornment, InputLabel } from '@mui/material';
import { parseNumberFromInput } from 'model';
import React, { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { RangeShortcut, RangeShortcutsDropdown } from './RangeShortcutsDropdown';
import { RHFOutlinedInput, RHFSwitch } from './react-hook-form-mui';
import { setFormValue, typedMemo } from './utilities';

export interface RangeSelectorProps {
  path: string;

  lowerBound?: number;
  upperBound?: number;
  unit?: string;

  shortcuts?: RangeShortcut[];
  shortcutsComment?: string;
  label?: React.ReactNode;
}

interface RangePointInputProps {
  id?: string;
  startAdornmentText?: string;
  endAdornmentText?: string;
  edgePath: string;
  lowerBound?: number | null;
  upperBound?: number | null;
}

const RangePointInput = typedMemo(function RangePointInput(props: RangePointInputProps) {
  return (
    <RHFOutlinedInput
      id={props.id}
      path={props.edgePath}
      inputMode="numeric"
      pattern="[0-9]*"
      startAdornment={
        props.startAdornmentText ? <InputAdornment position="start">{props.startAdornmentText}</InputAdornment> : null
      }
      endAdornment={
        props.endAdornmentText ? <InputAdornment position="end">{props.endAdornmentText}</InputAdornment> : null
      }
    />
  );
});

export const RangeSelector = typedMemo(function RangeSelector(props: RangeSelectorProps) {
  const context = useFormContext();
  const isExactPath = `${props.path}.isExact`;
  const startPath = `${props.path}.min`;
  const endPath = `${props.path}.max`;

  // Handle changes: trigger other fields so that validation errors are shown all fields
  const isExact: boolean = useWatch({ control: context.control, name: isExactPath });
  const startValue = parseNumberFromInput(useWatch({ control: context.control, name: startPath }));
  const endValue = parseNumberFromInput(useWatch({ control: context.control, name: endPath }));
  useEffect(() => {
    context.trigger(startPath);
    context.trigger(endPath);
  }, [context, startValue, endValue, isExact]);

  const startInputId = 'field-' + startPath;
  const endInputId = 'field-' + endPath;
  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <div>
          <InputLabel htmlFor={startInputId}>{props.label}</InputLabel>
        </div>
        <Box display="flex">
          <RHFSwitch path={isExactPath} />
          {props.shortcuts && (
            <RangeShortcutsDropdown
              unit={props.unit}
              shortcuts={props.shortcuts}
              shortcutsComment={props.shortcutsComment}
              onSelect={(range) => {
                const values = range.toFormValuesWithSwitch();
                setFormValue(context, startPath, values.min);
                setFormValue(context, endPath, values.max);
                if (!values.isExact) {
                  setFormValue(context, isExactPath, false);
                }
              }}
            />
          )}
        </Box>
      </Box>
      {!isExact ? (
        <Box sx={{ display: 'flex', gap: '1em' }}>
          <RangePointInput
            id={startInputId}
            edgePath={startPath}
            startAdornmentText="от"
            endAdornmentText={props.unit}
          />
          <RangePointInput id={endInputId} edgePath={endPath} startAdornmentText="до" endAdornmentText={props.unit} />
        </Box>
      ) : (
        <RangePointInput
          id={startInputId}
          edgePath={startPath}
          lowerBound={props.lowerBound}
          upperBound={props.upperBound}
          startAdornmentText="ровно"
          endAdornmentText={props.unit}
        />
      )}
    </>
  );
});
