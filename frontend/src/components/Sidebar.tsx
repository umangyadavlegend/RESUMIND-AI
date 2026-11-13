import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  LogOut,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { User } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  onLogout,
  user,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'workspace', label: 'New Screening', icon: UploadCloud, badge: 'AI' },
    { id: 'candidates', label: 'All Candidates', icon: Users },
    { id: 'jobs', label: 'Job Descriptions', icon: Briefcase },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const userDisplayName = user?.full_name || 'Authenticated Recruiter';
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-surface border-r border-border-subtle transition-all duration-300 z-30 select-none min-h-screen',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-subtle">
        <div
          onClick={() => onSelectTab('landing')}
          className="flex items-center gap-3 cursor-pointer group overflow-hidden"
        >
          {/* Brand Logo Glyph */}
          <div className="w-9 h-9 rounded-xl bg-accent-red flex items-center justify-center font-black text-white shadow-glow-red group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base tracking-tight font-sans flex items-center gap-1.5">
                RESUMIND <span className="text-accent-red font-mono text-xs px-1.5 py-0.5 rounded bg-accent-red/10 border border-accent-red/30">AI</span>
              </span>
              <span className="text-[10px] text-primary-muted -mt-0.5">Recruitment Intelligence</span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-primary-muted hover:text-white hover:bg-surface-card border border-transparent hover:border-border-subtle transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group',
                isActive
                  ? 'bg-accent-red/15 text-white border border-accent-red/30 shadow-glow-subtle'
                  : 'text-primary-secondary hover:text-white hover:bg-surface-card border border-transparent'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'w-5 h-5 shrink-0 transition-colors',
                  isActive ? 'text-accent-red' : 'text-primary-muted group-hover:text-white'
                )}
              />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-accent-red/20 text-accent-red border border-accent-red/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Ethical Guardrail Pill */}
      {!isCollapsed && (
        <div className="mx-3 my-2 p-3 rounded-xl bg-surface-card/60 border border-border-subtle text-xs">
          <div className="flex items-center gap-1.5 text-status-success font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" /> Bias-Free Certified
          </div>
          <p className="text-[11px] text-primary-muted leading-tight">
            Demographic characteristics excluded from scoring models.
          </p>
        </div>
      )}

      {/* User Profile Card & Dedicated Logout Button */}
      <div className="p-3 border-t border-border-subtle space-y-2 bg-surface-subtle/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface-card border border-border-hover flex items-center justify-center text-xs font-mono font-bold text-accent-red shrink-0 shadow-card">
            {userInitials || 'R'}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-white truncate">{userDisplayName}</p>
                {user?.is_verified && (
                  <span title="Verified Account" className="shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-status-success" />
                  </span>
                )}
              </div>
              <p className="text-[11px] text-primary-muted truncate">{user?.email || 'recruiter@resumind.ai'}</p>
            </div>
          )}
        </div>

        {/* Logout Option */}
        <button
          onClick={onLogout}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border',
            'border-border-subtle bg-surface text-primary-secondary hover:text-status-danger hover:border-status-danger/40 hover:bg-status-danger/10 shadow-card'
          )}
          title="Sign out of RESUMIND AI and invalidate server session"
        >
          <LogOut className="w-4 h-4 text-status-danger shrink-0" />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
};
