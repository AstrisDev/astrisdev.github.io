import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { CssBaseline } from '@mui/material';

import { createRoot } from 'react-dom/client';
import React from 'react';
import { AppLoader } from './components/AppLoader.tsx';

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <CssBaseline />
    <AppLoader />
  </React.StrictMode>,
);
