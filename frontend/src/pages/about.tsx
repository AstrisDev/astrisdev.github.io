import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import { Page } from './page.ts';
import { Box } from '@mui/material';
import Button from '@mui/material/Button';
import GitHubIcon from '@mui/icons-material/GitHub';

function AboutPageContent() {
  const githubLink: string = import.meta.env.VITE_SF_GITHUB_LINK;
  return (
    <Box width="100%" p={2}>
      <Box display="flex" mb={2}>
        <Button variant="contained" color="secondary" endIcon={<GitHubIcon />} target="_blank" href={githubLink}>
          Github
        </Button>
      </Box>
      <Box>Здесь можно было написать что-нибудь, но зачем?</Box>
    </Box>
  );
}

export const About: Page = {
  key: 'about',
  navIcon: <InfoIcon />,
  navText: 'О сайте',
  renderContent(): React.ReactNode {
    return <AboutPageContent />;
  },
  renderSidebar(): React.ReactNode {
    return <></>;
  },
};
