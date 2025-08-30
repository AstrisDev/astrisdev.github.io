import { ReactNode } from 'react';
import { AppLayout } from './AppLayout';
import { AppTitle } from './AppTitle.tsx';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import Pages from '../pages';
import { Page } from '../pages/page.ts';
import { useDrawer, useSetDrawerContent } from '../state/drawer.tsx';
import { Box } from '@mui/material';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AppLayout drawerContent={<AppDrawerContent />} mainContent={<Outlet></Outlet>} mainTitle={<AppTitle />} />
    ),
    children: [
      ...Pages.map((p) => ({
        path: p.key,
        element: <PageWrapper page={p} />,
      })),
      {
        path: '*',
        element: <Box p={2}>Страница не найдена</Box>,
      },
      {
        path: '',
        element: <Navigate to="/search" replace={true} />,
      },
    ],
  },
]);

function PageWrapper(props: { page: Page }): ReactNode {
  useSetDrawerContent(props.page.renderSidebar());
  return props.page.renderContent();
}

function AppDrawerContent() {
  return useDrawer((s) => s.content);
}

function App() {
  return <RouterProvider router={router} />;
}

export default App;
