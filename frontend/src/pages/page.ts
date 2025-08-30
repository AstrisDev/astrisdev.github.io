import { ReactNode } from 'react';

export interface Page {
  key: string;
  navIcon: ReactNode;
  navText: string;
  renderSidebar(): ReactNode;
  renderContent(): ReactNode;
}
