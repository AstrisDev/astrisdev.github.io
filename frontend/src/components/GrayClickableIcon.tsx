import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SvgIcon from '@mui/material/SvgIcon/SvgIcon';
import React from 'react';

const makeGrayClickableIcon = (Icon: typeof SvgIcon) =>
  React.forwardRef((props: { onClick: (e: unknown) => void }, ref: React.ForwardedRef<SVGSVGElement>) => (
    <Icon
      ref={ref}
      onClick={(e) => {
        e.preventDefault();
        props.onClick(e);
      }}
      sx={{
        color: 'rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        display: 'block',
        '&:hover': {
          color: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    />
  ));

export const GrayExpandMoreIcon = makeGrayClickableIcon(ExpandMoreIcon);
