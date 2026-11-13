import React from 'react';
import { Sparkles, ShieldCheck, Database, UploadCloud, LogOut, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  onNavigate: (tab: string) => void;
  currentTab: string;
  isAuthenticated: boolean;
  onLogout?: () => void;
  user?: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  currentTab,
  isAuthenticated,
  onLogout,
  user,
}) => {
  const userDisplayName = user?.full_name || 'Recruiter';
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border-subtle sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      {/* Brand & Status */}
      <div className="flex items-center gap-4">
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-accent-red flex items-center justify-center font-black text-white shadow-glow-red group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-white text-base tracking-tight hidden sm:inline">
            RESUMIND <span className="text-accent-red">AI</span>
          </span>
        </div>

        {/* Engine status indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs text-primary-secondary">
          <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
          <span>NLP Engine: <strong>Autonomous Heuristic (Bias-Free)</strong></span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('workspace')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold transition-all shadow-glow-subtle"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Screen Resumes</span>
            </button>

            {/* Profile Pill with User Name */}
            <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
              <div
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-surface hover:bg-surface-card border border-border-subtle cursor-pointer transition-colors"
                title="Account Settings"
              >
                <div className="w-6 h-6 rounded-lg bg-accent-red/20 text-accent-red font-mono font-bold text-[10px] flex items-center justify-center border border-accent-red/30">
                  {userInitials || 'R'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white leading-tight">{userDisplayName}</span>
                    {user?.is_verified && (
                      <span title="Verified">
                        <CheckCircle2 className="w-3 h-3 text-status-success" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-primary-muted block -mt-0.5">{user?.email}</span>
                </div>
              </div>

              {/* Topbar Logout Button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-status-danger/30 text-status-danger hover:bg-status-danger/10 text-xs font-bold transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('auth')}
              className="px-3 py-1.5 rounded-lg text-primary-secondary hover:text-white text-xs font-semibold"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('auth')}
              className="px-3.5 py-1.5 rounded-lg bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold transition-all shadow-glow-subtle"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
