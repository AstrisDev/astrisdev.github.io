import { AppBar, Box, Divider, IconButton, SwipeableDrawer, Toolbar } from '@mui/material';
import ViewSidebarIcon from '@mui/icons-material/ViewSidebar';
import React, { useEffect, useState } from 'react';

export interface AppLayoutProps {
  drawerTitle?: React.ReactNode;
  drawerContent?: React.ReactNode;
  mainTitle?: React.ReactNode;
  mainContent?: React.ReactNode;
}

function useWindowWidth(): number {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect((): (() => void) | void => {
    const resizeObserver = new ResizeObserver((entries) => {
      const newWidth = entries[0]?.contentBoxSize[0]?.inlineSize;
      if (newWidth) {
        setWindowWidth(newWidth);
      }
    });
    resizeObserver.observe(document.body);
    return () => resizeObserver.disconnect();
  }, []);
  return windowWidth;
}

export function AppLayout({ drawerContent, drawerTitle, mainContent, mainTitle }: AppLayoutProps): React.ReactElement {
  const windowWidth = useWindowWidth();
  const isScreenSmall = windowWidth <= 600;
  const [drawerOpened, setDrawerOpened] = useState(false);

  const drawerWidth = 'min(360px, 90vw)';
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <SwipeableDrawer
        anchor="left"
        variant={isScreenSmall ? 'temporary' : 'permanent'}
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          flexShrink: 0,
        }}
        disableSwipeToOpen={true}
        onOpen={() => setDrawerOpened(true)}
        onClose={() => setDrawerOpened(false)}
        open={!isScreenSmall || drawerOpened}
      >
        <Toolbar>{drawerTitle}</Toolbar>
        <Divider />
        <Box flexGrow={1} p={3}>
          {drawerContent}
        </Box>
      </SwipeableDrawer>
      <Box display="flex" flexDirection="column" flexGrow={1} height="100%">
        <AppBar position="static">
          <Toolbar sx={{ alignItems: 'center' }}>
            {isScreenSmall && (
              <IconButton color="inherit" edge="start" onClick={() => setDrawerOpened(true)}>
                <ViewSidebarIcon />
              </IconButton>
            )}
            {mainTitle}
          </Toolbar>
        </AppBar>
        <Box component="main" flexGrow={1}>
          {mainContent}
        </Box>
      </Box>
    </Box>
  );
}
