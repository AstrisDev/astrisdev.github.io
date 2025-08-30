import { Page } from './page.ts';
import React from 'react';
import StarIcon from '@mui/icons-material/Star';
import { useAppStore } from '../state/app.store.ts';
import { StampList } from '../components/StampList.tsx';
import { useFavoritesStore } from '../state/favorites.store.ts';

function FavoritesPageMainContent() {
  const database = useAppStore((s) => s.database);
  const favorites = useFavoritesStore((s) => s.filterFavorites(database.stamps));
  return <StampList stamps={favorites}></StampList>;
}

export const Favorites: Page = {
  key: 'favorites',
  navIcon: <StarIcon />,
  navText: 'Избранное',
  renderContent(): React.ReactNode {
    return <FavoritesPageMainContent />;
  },
  renderSidebar(): React.ReactNode {
    return <></>;
  },
};
