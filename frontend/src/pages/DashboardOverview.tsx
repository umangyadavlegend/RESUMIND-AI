import React, { useState, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  Award,
  Clock,
  Sparkles,
  UploadCloud,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { api } from '../services/api';
import { AnalyticsOverview, User } from '../types';

interface DashboardOverviewProps {
  onNavigate: (tab: string, payload?: any) => void;
  user: User | null;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  user,
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const chartData = (analytics?.score_distribution || []).map((item) => ({
    name: item.range.split(' ')[0], // e.g. "90-100%"
    count: item.count,
    label: item.range,
  }));

  const isEmptyPipeline = !loading && (analytics?.total_resumes === 0) && (analytics?.active_jobs === 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner with Registered User's Full Name */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface-card border border-border-hover relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-red/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border-subtle text-xs font-semibold text-accent-red mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Autonomous Recruiter Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-accent-red">{user?.full_name || 'Recruiter'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-primary-secondary mt-1">
            Real-time screening intelligence, applicant distributions, and transparent candidate scores.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => onNavigate('jobs')}
            className="px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-cardHover border border-border-subtle text-xs font-semibold text-primary-secondary hover:text-white transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4 text-blue-400" />
            <span>Create Job</span>
          </button>

          <button
            onClick={() => onNavigate('workspace')}
            className="px-5 py-2.5 rounded-xl bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold transition-all shadow-glow-subtle flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Screen Resumes</span>
          </button>
        </div>
      </div>

      {/* Empty State Onboarding for New Users */}
      {isEmptyPipeline && (
        <div className="p-8 rounded-3xl bg-surface-card border border-border-subtle text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-accent-red/10 border border-accent-red/30 mx-auto flex items-center justify-center text-accent-red mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your Personal Screening Pipeline is Ready</h2>
          <p className="text-sm text-primary-secondary max-w-xl mx-auto mb-6">
            You haven't uploaded any resumes or created job profiles yet. Get started in two simple steps: add a target position, then upload PDF or DOCX resumes to generate explainable candidate rankings.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('jobs')}
              className="px-5 py-2.5 rounded-xl bg-surface hover:bg-surface-cardHover border border-border-subtle text-xs font-bold text-white transition-colors flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-accent-red" />
              <span>Step 1: Create Job Description</span>
            </button>
            <button
              onClick={() => onNavigate('workspace')}
              className="px-5 py-2.5 rounded-xl bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold transition-all shadow-glow-subtle flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Step 2: Upload Resumes</span>
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-primary-muted">
            <ShieldCheck className="w-4 h-4 text-status-success" />
            <span>Ethical AI Guardrails active: Demographic attributes strictly excluded from scoring.</span>
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors shadow-card">
          <div className="flex items-center justify-between text-primary-muted mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Processed</span>
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-accent-red">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {loading ? '—' : analytics?.total_resumes || 0}
          </div>
          <p className="text-[11px] text-primary-muted mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-status-success" />
            <span>Resumes parsed into database</span>
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors shadow-card">
          <div className="flex items-center justify-between text-primary-muted mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-blue-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {loading ? '—' : analytics?.active_jobs || 0}
          </div>
          <p className="text-[11px] text-primary-muted mt-2 flex items-center gap-1">
            <span>Target position descriptions</span>
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors shadow-card">
          <div className="flex items-center justify-between text-primary-muted mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Match Score</span>
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-status-success">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-status-success">
            {loading ? '—' : `${analytics?.avg_match_score || 0}%`}
          </div>
          <p className="text-[11px] text-primary-muted mt-2">
            Weighted 4-pillar average
          </p>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors shadow-card">
          <div className="flex items-center justify-between text-primary-muted mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting Review</span>
            <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-status-warning">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-status-warning">
            {loading ? '—' : analytics?.candidates_pending_review || 0}
          </div>
          <p className="text-[11px] text-primary-muted mt-2">
            Candidates ready for decision
          </p>
        </div>
      </div>

      {/* Main Grid: Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Distribution Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Candidate Score Distribution</h3>
              <p className="text-xs text-primary-secondary">Prorated applicant counts across match tiers</p>
            </div>
            <button
              onClick={() => onNavigate('candidates')}
              className="text-xs font-semibold text-accent-red hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 || chartData.every(c => c.count === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-primary-muted text-xs">
                <FileText className="w-8 h-8 mb-2 opacity-30" />
                <span>No scoring data available yet. Screen resumes to view distributions.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717A" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#141414',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#FFF',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => {
                      const colors = ['#35C98B', '#38bdf8', '#a855f7', '#E5A83B', '#EF4444'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top In-Demand Skills (1 col) */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-card flex flex-col">
          <h3 className="text-base font-bold text-white mb-1">Top Matched Skills</h3>
          <p className="text-xs text-primary-secondary mb-4">Most frequent normalized qualifications</p>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {(!analytics?.top_skills_matched || analytics.top_skills_matched.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-primary-muted text-xs text-center py-8">
                <span>No skills extracted yet. Upload resumes to discover skill frequencies.</span>
              </div>
            ) : (
              (analytics.top_skills_matched || []).slice(0, 6).map((item) => (
                <div key={item.skill} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white">{item.skill}</span>
                    <span className="font-mono text-primary-muted">{item.count} resumes</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-red rounded-full"
                      style={{ width: `${Math.min(100, (item.count / 15) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-border-subtle mt-4">
            <button
              onClick={() => onNavigate('workspace')}
              className="w-full py-2 rounded-xl bg-surface hover:bg-surface-cardHover border border-border-subtle text-xs font-semibold text-white transition-colors"
            >
              Analyze New Resume Batch
            </button>
          </div>
        </div>
      </div>

      {/* Recent Screening Activity */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Screening Sessions</h3>
            <p className="text-xs text-primary-secondary">Executed resume evaluation pipelines</p>
          </div>
          <button
            onClick={() => onNavigate('candidates')}
            className="text-xs font-semibold text-accent-red hover:underline flex items-center gap-1"
          >
            <span>See Leaderboard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {(!analytics?.recent_activity || analytics.recent_activity.length === 0) ? (
            <div className="text-center py-8 text-primary-muted text-xs">
              <span>No screening sessions completed yet. Start your first session in the Screening Workspace.</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-primary-muted font-semibold">
                  <th className="pb-3">Session Title</th>
                  <th className="pb-3">Candidates</th>
                  <th className="pb-3">Avg Match</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {(analytics?.recent_activity || []).map((session) => (
                  <tr key={session.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 font-semibold text-white">{session.title}</td>
                    <td className="py-3 font-mono text-primary-secondary">{session.candidates_count} Resumes</td>
                    <td className="py-3 font-mono font-bold text-status-success">{session.avg_score}%</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-success bg-status-success/10 px-2 py-0.5 rounded-full border border-status-success/20">
                        <CheckCircle2 className="w-3 h-3" /> {session.status}
                      </span>
                    </td>
                    <td className="py-3 text-primary-muted">{session.date}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onNavigate('candidates')}
                        className="px-2.5 py-1 rounded bg-surface border border-border-subtle hover:border-accent-red text-white text-[11px] font-semibold transition-colors"
                      >
                        View Results
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
