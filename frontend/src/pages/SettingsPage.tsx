import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  Trash2,
  Database,
  Cpu,
  Lock,
  LogOut,
  CheckCircle,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { SystemStatus, User as UserType } from '../types';

interface SettingsPageProps {
  user: UserType | null;
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onLogout,
}) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.getSystemStatus();
        setStatus(data);
      } catch (err) {
        console.error('Failed to load system status', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCleanup = async () => {
    if (!confirm('Are you sure? This will permanently delete all uploaded resumes and candidate profiles in compliance with data retention policies.')) {
      return;
    }
    try {
      setIsCleaning(true);
      const res = await api.cleanupResumes();
      setCleanupMessage(res.message);
    } catch (err: any) {
      setCleanupMessage(`Cleanup failed: ${err.message}`);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs font-semibold text-accent-red mb-2">
          <SettingsIcon className="w-3.5 h-3.5" /> Workspace Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System & Enterprise Settings
        </h1>
        <p className="text-xs text-primary-secondary mt-1">
          Recruiter account profile, data retention controls, and AI scoring parameters.
        </p>
      </div>

      {/* Notifications */}
      {cleanupMessage && (
        <div className="p-4 rounded-2xl bg-status-success/10 border border-status-success/30 text-xs text-status-success flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{cleanupMessage}</span>
        </div>
      )}

      {/* Section 1: User Profile */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-accent-red">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{user?.full_name || 'Authenticated Recruiter'}</span>
                {user?.is_verified && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-status-success/15 text-status-success border border-status-success/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </span>
                )}
              </h3>
              <p className="text-xs text-primary-secondary">Active recruiter profile</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl border border-status-danger/30 text-status-danger hover:bg-status-danger/10 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-surface rounded-xl border border-border-subtle">
            <span className="text-[11px] text-primary-muted block">Work Email</span>
            <span className="text-sm font-semibold text-white font-mono">{user?.email || 'recruiter@resumind.ai'}</span>
          </div>

          <div className="p-3 bg-surface rounded-xl border border-border-subtle">
            <span className="text-[11px] text-primary-muted block">Organization</span>
            <span className="text-sm font-semibold text-white">{user?.company_name || 'Apex Technologies'}</span>
          </div>
        </div>
      </div>

      {/* Section 2: AI Engine Architecture */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-status-success">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Document NLP & Scoring Engine</h3>
            <p className="text-xs text-primary-secondary">Autonomous extraction model specification</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 text-xs">
          <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-subtle">
            <span className="text-primary-secondary">Screening Pipeline Engine:</span>
            <span className="font-semibold text-white font-mono">{status?.nlp_engine || 'Autonomous Heuristic NLP (Bias-Free)'}</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-subtle">
            <span className="text-primary-secondary">Scoring Model:</span>
            <span className="font-semibold text-white font-mono">Skills 50% • Exp 30% • Edu 10% • Proj 10%</span>
          </div>

          <div className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-subtle">
            <span className="text-primary-secondary">Database Storage:</span>
            <span className="font-semibold text-white font-mono">{status?.database || 'SQLite / PostgreSQL'}</span>
          </div>
        </div>
      </div>

      {/* Section 3: Data Retention & Privacy Controls */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border-subtle shadow-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-status-warning">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Data Retention & Privacy Controls</h3>
            <p className="text-xs text-primary-secondary">GDPR & ethical recruitment document purge</p>
          </div>
        </div>

        <p className="text-xs text-primary-secondary leading-relaxed pt-1">
          In accordance with enterprise data privacy best practices, you can delete all stored resume binaries, extracted text, and candidate records with one click.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={handleCleanup}
            disabled={isCleaning}
            className="px-4 py-2.5 rounded-xl bg-status-danger/10 hover:bg-status-danger/20 border border-status-danger/30 text-status-danger text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isCleaning ? 'Purging Resumes...' : 'Purge All Uploaded Resumes'}</span>
          </button>
        </div>
      </div>

      {/* Prominent Bottom Logout Button */}
      <div className="pt-4 flex justify-end">
        <button
          onClick={onLogout}
          className="px-6 py-3 rounded-xl bg-status-danger/15 hover:bg-status-danger/25 border border-status-danger/40 text-status-danger text-xs font-bold transition-colors flex items-center gap-2 shadow-card"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of RESUMIND AI</span>
        </button>
      </div>
    </div>
  );
};
