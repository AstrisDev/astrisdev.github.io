import { create } from 'zustand';
import { ReactNode, useEffect } from 'react';

export interface DrawerState {
  content: ReactNode;
  setContent(content: ReactNode): void;
}

export const useDrawer = create<DrawerState>((set) => ({
  content: <></>,
  setContent(content: ReactNode) {
    set({ content: content });
  },
}));
export const useSetDrawerContent = (content: ReactNode) => {
  const setContent = useDrawer((s) => s.setContent);
  useEffect(() => {
    setContent(content);
  }, [setContent, content]);
};
