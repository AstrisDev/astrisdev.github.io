import { Box, Typography } from '@mui/material';
import { Stamp } from 'api/SfDatabase';
import { StampCard } from 'components/StampCard';
import _ from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeGrid } from 'react-window';
import NoStampsImage from './icons/no-stamps.svg';
import { preloadImage } from '../tools/preload-image.ts';

export interface StampListProps {
  stamps: Array<Stamp>;
  innerRef?: React.RefObject<FixedSizeGrid<Stamp[]>>;
}

const NoStampsMessage: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" justifyContent="center" alignItems="center">
      <img src={NoStampsImage} width="256px" alt="" />
      <Typography>Ничего не найдено</Typography>
    </Box>
  );
};

interface StampGridData {
  gutterHoriz: number;
  gutterVert: number;
  nColumns: number;
  nRows: number;
  columnWidth: number;
  stamps: Stamp[];
  handleMountedItem: (element: HTMLDivElement | null) => void;
}

const StampGridItem = (props: {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: StampGridData;
}) => {
  const { data, columnIndex, rowIndex } = props;
  const { stamps, columnWidth, nColumns, gutterHoriz } = data;

  // preload images for the next rows
  if (columnIndex == 0) {
    const nRowsToPreload = 4;
    for (let i = 0; i < nRowsToPreload * nColumns; i++) {
      const imageUrl = stamps[rowIndex * nColumns + i]?.imageUrl;
      if (imageUrl) {
        preloadImage(imageUrl);
      }
    }
  }

  // render a card
  return (
    <div
      ref={props.data.handleMountedItem}
      style={{
        ..._.omit(props.style, 'height'),
        top: ((props.style.top ?? 0) as number) + 20,
        left: gutterHoriz + (columnWidth + gutterHoriz) * columnIndex,
        width: columnWidth,
      }}
    >
      {rowIndex * nColumns + columnIndex < stamps.length && (
        <StampCard stamp={stamps[rowIndex * nColumns + columnIndex]} />
      )}
    </div>
  );
};

const StampListImpl = React.memo(function StampListImpl(props: {
  stamps: Stamp[];
  width: number;
  height: number;
  innerRef?: React.RefObject<FixedSizeGrid>;
}): React.ReactElement {
  // Determine layout parameters
  const gutterHoriz = 16;
  const gutterVert = 16;
  const nColumns = Math.max(1, Math.floor(props.width / 270));
  const nRows = Math.ceil(props.stamps.length / nColumns);
  const columnWidth = (props.width - gutterHoriz * (nColumns + 1)) / nColumns;
  const columnWidthPassedToGrid = props.width / nColumns; // does it affect anything?

  // Each resize columnWidth changes leading to change in cardHeight.
  // We need to determine cardHeight of any card and use it for computing card positions.
  // cardHeight = 0 means that it is not defined yet
  //   in such case we render only the first row to determine card height
  const [cardHeight, setCardHeight] = useState(0);
  const lastColumnWidth = useRef<number>(0);
  const handleMountedItem = useCallback(
    (div: HTMLDivElement | null) => {
      if (div !== null && lastColumnWidth.current !== columnWidth) {
        lastColumnWidth.current = columnWidth;
        setCardHeight(div.clientHeight);
      }
    },
    [columnWidth],
  );
  const gridData: StampGridData = {
    gutterHoriz,
    gutterVert,
    nColumns,
    nRows,
    columnWidth,
    stamps: props.stamps,
    handleMountedItem,
  };

  return (
    <FixedSizeGrid
      ref={props.innerRef}
      width={props.width}
      height={props.height}
      rowCount={cardHeight !== 0 ? nRows : 1}
      columnCount={nColumns}
      columnWidth={columnWidthPassedToGrid}
      rowHeight={cardHeight + gutterVert}
      itemData={gridData}
    >
      {StampGridItem}
    </FixedSizeGrid>
  );
});

export const StampList: React.FC<StampListProps> = (props) => {
  if (props.stamps.length === 0) {
    return <NoStampsMessage />;
  }

  return (
    <AutoSizer>
      {(args: { width?: number; height?: number }) => (
        <StampListImpl
          innerRef={props.innerRef}
          width={args.width ?? 1}
          height={args.height ?? 1}
          stamps={props.stamps}
        />
      )}
    </AutoSizer>
  );
};
