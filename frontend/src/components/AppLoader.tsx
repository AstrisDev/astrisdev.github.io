import React from 'react';
import { useAsync } from 'react-use';
import { StampApi } from '../api/StampApi.ts';
import { GAWrapper } from './GAWrapper.tsx';
import App from './App.tsx';
import { Alert, AlertTitle, Box } from '@mui/material';
import BeatLoader from 'react-spinners/BeatLoader';
import { ApiError } from '../api/fetch-helper.ts';
import { AppInitializer } from './AppInitializer.tsx';

async function loadEverything() {
  const stampApi = new StampApi();
  const database = await stampApi.loadDatabase();
  return { database, stampApi };
}

export const AppLoader: React.FC = () => {
  // Load data
  const asyncData = useAsync(loadEverything);

  if (asyncData.value) {
    // Data loaded: initialize & start the app
    const gaTag = import.meta.env.VITE_SF_GA_TAG;
    return (
      <GAWrapper tag={gaTag}>
        <AppInitializer database={asyncData.value.database}>
          <App />
        </AppInitializer>
      </GAWrapper>
    );
  }
  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      {!asyncData.error && <BeatLoader />}
      {asyncData.error && (
        <Alert severity="error">
          <AlertTitle>Не удалось загрузить данные</AlertTitle>
          <pre>{(asyncData.error as ApiError).message}</pre>
        </Alert>
      )}
    </Box>
  );
};
