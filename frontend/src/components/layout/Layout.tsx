import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { NavItem } from './Sidebar';

interface LayoutProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  onSimulationComplete?: (result: any) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  onSimulationComplete,
  children,
}) => {
  return (
    <div className="app-container">
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />
      <div className="main-content">
        <Header currentTab={currentTab} onSimulationComplete={onSimulationComplete} />
        <main className="page-wrapper">{children}</main>
      </div>
    </div>
  );
};
