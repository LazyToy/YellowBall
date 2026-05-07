'use client';

import { createContext, useContext } from 'react';
import {
  createDefaultMenuSettings,
  type MenuSettings,
} from '@/lib/super-admin-data';

const AppMenuContext = createContext<MenuSettings | null>(null);

export function AppMenuProvider({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: MenuSettings;
}) {
  return (
    <AppMenuContext.Provider value={settings}>
      {children}
    </AppMenuContext.Provider>
  );
}

export function useAppMenuSettings() {
  return useContext(AppMenuContext) ?? createDefaultMenuSettings();
}
