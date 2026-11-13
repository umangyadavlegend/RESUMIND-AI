import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';
import { User } from '../types';

interface DashboardLayoutProps {
  currentTab: string;
  onNavigate: (tab: string, payload?: any) => void;
  onLogout: () => void;
  user: User | null;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onNavigate,
  onLogout,
  user,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const mobileNavItems = [
    { id: 'overview', label: 'Home', icon: LayoutDashboard },
    { id: 'workspace', label: 'Screen', icon: UploadCloud },
    { id: 'candidates', label: 'Applicants', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-primary">
      {/* Desktop Collapsible Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={onNavigate}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onLogout={onLogout}
          user={user}
        />
      </div>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onNavigate={onNavigate}
          currentTab={currentTab}
          isAuthenticated={true}
          onLogout={onLogout}
          user={user}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden sticky bottom-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border-subtle flex items-center justify-around py-2 px-3">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-accent-red font-bold' : 'text-primary-muted hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
