import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box, IconButton } from '@mui/material';
import { StampField } from 'model';
import { useController, useFormContext } from 'react-hook-form';
import { RHFSelect } from './react-hook-form-mui';

export interface SortSelectorProps {
  labelId?: string;
  path: string;
}

export function SortSelector(props: SortSelectorProps) {
  const context = useFormContext();
  const dirController = useController({
    control: context.control,
    name: props.path + '.direction',
  });
  const flippedDirection = dirController.field.value === 'asc' ? 'desc' : 'asc';
  const ArrowComponent = dirController.field.value === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon;
  const allFieldValues = StampField.AllValues.map((field) => ({
    value: field.id,
    label: field.displayName,
  }));
  return (
    <Box display="flex">
      <RHFSelect labelId={props.labelId} path={props.path + '.fieldId'} values={allFieldValues} />
      <IconButton
        sx={{ ml: '0' }}
        size="medium"
        color="inherit"
        edge="start"
        onClick={() => dirController.field.onChange(flippedDirection)}
      >
        <ArrowComponent />
      </IconButton>
    </Box>
  );
}
