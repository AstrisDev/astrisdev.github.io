import { Box } from '@mui/material';
import { ReactNode, useCallback, useRef, useState } from 'react';
import { usePopper } from 'react-popper';
import useOnClickOutside from 'use-onclickoutside';

export const useCloseablePopup = (children: ReactNode) => {
  const [isOpen, setOpen] = useState(false);
  const openPopup = useCallback(() => setOpen(true), []);
  const closePopup = useCallback(() => setOpen(false), []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);

  useOnClickOutside(containerRef, isOpen ? closePopup : null);
  const { styles, attributes } = usePopper(referenceElement, popperElement);

  const elements = isOpen ? (
    <Box
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
      padding={1}
      boxShadow="0 0 5px rgba(0, 0, 0, 0.3)"
      borderRadius="5px"
      zIndex={10}
      bgcolor="white"
    >
      {children}
    </Box>
  ) : (
    <></>
  );

  const containerProps = {
    onTouchStart: openPopup,
    onClick: openPopup,
    onMouseEnter: openPopup,
    onMouseLeave: closePopup,
  };

  return { elements, containerRef, setReferenceElement, openPopup, closePopup, setOpen, isOpen, containerProps };
};
