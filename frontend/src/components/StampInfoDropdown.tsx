import MoreIcon from '@mui/icons-material/More';
import { Box, BoxProps, Typography } from '@mui/material';
import { Stamp } from 'api/SfDatabase';
import React from 'react';
import { useCloseablePopup } from './popup';

function KeyValueBox(props: { name: string; value: string }) {
  return (
    <div>
      <Typography fontWeight="bold">{props.name}</Typography>
      <Typography>{props.value}</Typography>
    </div>
  );
}

const StampTextInfo: React.FC<{ stamp: Stamp }> = React.memo((props) => {
  const s = props.stamp;
  return (
    <div>
      {s.categories.length !== 0 && <KeyValueBox name="Категории" value={s.categories.join(', ')} />}
      {s.series && <KeyValueBox name="Серия" value={s.series} />}
      {s.name && <KeyValueBox name="Название" value={s.name} />}
      {s.shape?.text && <KeyValueBox name="Размер" value={s.shape.text} />}
    </div>
  );
});

export const StampInfoDropdown: React.FC<{ stamp: Stamp; sx?: BoxProps['sx'] }> = (props) => {
  const popup = useCloseablePopup(<StampTextInfo stamp={props.stamp} />);
  return (
    <Box ref={popup.containerRef} {...popup.containerProps} sx={props.sx}>
      <div ref={popup.setReferenceElement}>
        <MoreIcon sx={{ display: 'block' }} fontSize="small" />
      </div>
      {popup.elements}
    </Box>
  );
};
