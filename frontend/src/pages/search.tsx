import { Page } from './page.ts';
import React, { createRef, useEffect } from 'react';
import { Box, InputLabel } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { SearchOptionsForm } from '../components/SearchOptionsForm.tsx';
import { SearchOptions } from '../model';
import { ShareUrlButton } from '../components/ShareUrlButton.tsx';
import plural from 'plural-ru';
import { useAppStore } from '../state/app.store.ts';
import { StampList } from '../components/StampList.tsx';
import { FixedSizeGrid } from 'react-window';
import { Stamp } from '../api/SfDatabase.ts';
import { FormResetButton } from '../components/FormBits.tsx';

function ShareSearchUrlButton() {
  const options = useAppStore((s) => s.searchOptions);
  const loc = document.location;
  const url = loc.protocol + '//' + loc.host + loc.pathname + '?' + options.toUrlSearchString();
  return <ShareUrlButton title="Stamp Finder" url={url} />;
}

function SearchPageDrawerContent() {
  // Extract objects from global store
  const nStampsFound = useAppStore((s) => s.foundStamps.length);
  const database = useAppStore((s) => s.database);
  const formHandle = useAppStore((s) => s.searchFormHandle);

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <SearchOptionsForm handle={formHandle} />
      <InputLabel component="div">
        {`По запросу ${plural(nStampsFound, 'найдена', 'найдено', 'найдено')} ${nStampsFound} ${plural(
          nStampsFound,
          'марка',
          'марки',
          'марок',
        )}`}
      </InputLabel>
      <Box flexBasis={1} flexGrow={1} maxHeight="100%"></Box>
      <Box display="flex" justifyContent="end" gap={1}>
        <ShareSearchUrlButton />
        <FormResetButton context={formHandle.context} defaultData={SearchOptions.Default.toFormData(database)} />
      </Box>
    </Box>
  );
}

function SearchPageMainContent() {
  const foundStamps = useAppStore((s) => s.foundStamps);
  const gridRef = createRef<FixedSizeGrid<Stamp[]>>();
  useEffect(() => {
    gridRef.current?.scrollTo({ scrollTop: 0 });
  }, [foundStamps]);
  return <StampList stamps={foundStamps} innerRef={gridRef}></StampList>;
}

export const Search: Page = {
  key: 'search',
  navIcon: <SearchIcon />,
  navText: 'Поиск',
  renderContent(): React.ReactNode {
    return <SearchPageMainContent />;
  },
  renderSidebar(): React.ReactNode {
    return <SearchPageDrawerContent />;
  },
};
