import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { BarChart3, TrendingUp, Users, Award, Briefcase, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { AnalyticsOverview } from '../types';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-16 text-center text-primary-muted">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-accent-red" />
        <p className="text-sm">Aggregating recruitment performance metrics...</p>
      </div>
    );
  }

  const scoreChartData = (data?.score_distribution || []).map((d) => ({
    name: d.range.split(' ')[0],
    count: d.count,
    label: d.range,
  }));

  const pieData = [
    { name: 'Shortlisted', value: data.candidates_shortlisted, color: '#35C98B' },
    { name: 'Under Review', value: data.candidates_pending_review, color: '#E5A83B' },
    { name: 'Rejected', value: data.candidates_rejected, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs font-semibold text-accent-red mb-2">
          <BarChart3 className="w-3.5 h-3.5" /> Intelligence Reporting
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Recruitment Analytics & Insights
        </h1>
        <p className="text-xs text-primary-secondary mt-1">
          Historical screening metrics, score distributions, and qualification frequencies.
        </p>
      </div>

      {/* 3 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-card">
          <div className="flex justify-between items-center text-xs text-primary-muted mb-2 font-semibold">
            <span>TOTAL PROCESSED APPLICANTS</span>
            <Users className="w-4 h-4 text-accent-red" />
          </div>
          <div className="text-3xl font-black font-mono text-white">{data.total_resumes}</div>
          <p className="text-[11px] text-primary-muted mt-2">Parsed through document extraction</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-card">
          <div className="flex justify-between items-center text-xs text-primary-muted mb-2 font-semibold">
            <span>AVERAGE CANDIDATE MATCH</span>
            <Award className="w-4 h-4 text-status-success" />
          </div>
          <div className="text-3xl font-black font-mono text-status-success">{data.avg_match_score}%</div>
          <p className="text-[11px] text-primary-muted mt-2">Overall weighted 4-pillar index</p>
        </div>

        <div className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-card">
          <div className="flex justify-between items-center text-xs text-primary-muted mb-2 font-semibold">
            <span>ACTIVE JOB ROLES</span>
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white">{data.active_jobs}</div>
          <p className="text-[11px] text-primary-muted mt-2">Live requirement profiles</p>
        </div>
      </div>

      {/* Two Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-card">
          <h3 className="text-base font-bold text-white mb-1">Candidate Ranking Distribution</h3>
          <p className="text-xs text-primary-secondary mb-6">Percentage match score density across all screened applicants</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  {scoreChartData.map((_, index) => {
                    const colors = ['#35C98B', '#38bdf8', '#a855f7', '#E5A83B', '#EF4444'];
                    return <Cell key={`c-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top In-Demand Skills Chart */}
        <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-card">
          <h3 className="text-base font-bold text-white mb-1">Extracted Skills Frequency</h3>
          <p className="text-xs text-primary-secondary mb-6">Top normalized competencies discovered in applicant resumes</p>

          <div className="space-y-3">
            {data.top_skills_matched.length === 0 ? (
              <p className="text-xs text-primary-muted py-8 text-center">
                No extracted skills yet. Screen resumes in the workspace to populate live skill frequencies.
              </p>
            ) : (
              data.top_skills_matched.map((item) => (
                <div key={item.skill} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">{item.skill}</span>
                    <span className="font-mono text-primary-muted">{item.count} resumes</span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-red rounded-full"
                      style={{ width: `${Math.min(100, (item.count / 15) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Job-wise screening performance */}
      <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle shadow-card">
        <h3 className="text-base font-bold text-white mb-1">Job-Wise Screening Performance</h3>
        <p className="text-xs text-primary-secondary mb-4">Screening counts and average scores per target role</p>

        <div className="overflow-x-auto">
          {data.screening_performance.length === 0 ? (
            <p className="text-xs text-primary-muted py-8 text-center">
              No position performance records yet. Complete screening batches to view job performance analytics.
            </p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-primary-muted font-semibold">
                  <th className="pb-3">Position Title</th>
                  <th className="pb-3">Screening Sessions</th>
                  <th className="pb-3">Average Candidate Score</th>
                  <th className="pb-3 text-right">Performance Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.screening_performance.map((job, idx) => (
                  <tr key={idx} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 font-semibold text-white">{job.job_title}</td>
                    <td className="py-3 font-mono text-primary-secondary">{job.screenings_count} Runs</td>
                    <td className="py-3 font-mono font-bold text-status-success">{job.average_score}%</td>
                    <td className="py-3 text-right">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-status-success/10 text-status-success border border-status-success/20 font-medium">
                        High Quality Yield
                      </span>
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
