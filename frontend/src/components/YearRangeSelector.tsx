import { Box } from '@mui/material';
import _ from 'lodash';
import { memo, useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { maxOf, minOf, parseNumberFromInput } from '../model';
import { RHFSelect } from './react-hook-form-mui';

export interface YearRangeSelectorProps {
  labelId?: string;
  path: string;
  lowerBound?: number;
  upperBound?: number;
}

interface YearSelectorProps {
  labelId?: string;
  path: string;
  prefix?: string;
  lowerBound?: number | null;
  upperBound?: number | null;
}

const YearSelector = (props: YearSelectorProps) => {
  const context = useFormContext();
  let selectOptions: { value: string; label: string }[];
  const currentValue = useWatch({ control: context.control, name: props.path });
  if (props.lowerBound != undefined && props.upperBound != undefined) {
    const availableValues = _.range(props.lowerBound, props.upperBound + 1);
    if (currentValue && !availableValues.includes(Number(currentValue))) {
      availableValues.push(Number(currentValue));
    }
    selectOptions = [
      { value: '', label: '-' },
      ...availableValues.reverse().map((n) => ({
        value: n.toString(),
        label: `${props.prefix ?? ''}${n.toString()}`,
      })),
    ];
  } else {
    selectOptions = [{ value: '', label: '-' }];
  }
  return <RHFSelect labelId={props.labelId} path={props.path} values={selectOptions} />;
};

export const YearRangeSelector = memo(function YearRangeSelector(props: YearRangeSelectorProps) {
  const context = useFormContext();
  const minPath = `${props.path}.min`;
  const maxPath = `${props.path}.max`;
  // Compute bounds
  const startValue = parseNumberFromInput(useWatch({ control: context.control, name: minPath }));
  const endValue = parseNumberFromInput(useWatch({ control: context.control, name: maxPath }));
  const upperBoundOfStart = minOf([endValue, props.upperBound]);
  const lowerBoundOfEnd = maxOf([startValue, props.lowerBound]);
  // Trigger other fields so that validation errors are shown all fields
  useEffect(() => {
    context.trigger(minPath);
    context.trigger(maxPath);
  }, [context, minPath, maxPath, startValue, endValue]);

  return (
    <Box sx={{ display: 'flex', gap: '1em' }}>
      <YearSelector
        labelId={props.labelId}
        path={minPath}
        lowerBound={props.lowerBound}
        upperBound={upperBoundOfStart}
        prefix="с "
      />
      <YearSelector path={maxPath} lowerBound={lowerBoundOfEnd} upperBound={props.upperBound} prefix="по " />
    </Box>
  );
});
