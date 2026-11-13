import React from 'react';
import {
  Mail,
  Briefcase,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  GitCompare,
  Eye,
  Trash2
} from 'lucide-react';
import { Candidate, CandidateScore } from '../types';
import { ScoreBadge } from './ScoreBadge';

interface CandidateCardProps {
  candidate: Candidate;
  score?: CandidateScore;
  rank?: number;
  isSelectedForCompare?: boolean;
  onSelectForCompare?: () => void;
  onViewProfile: (id: number) => void;
  onStatusChange: (id: number, status: 'pending' | 'shortlisted' | 'review' | 'rejected') => void;
  onDelete?: (id: number) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  score = candidate.latest_score,
  rank,
  isSelectedForCompare,
  onSelectForCompare,
  onViewProfile,
  onStatusChange,
  onDelete,
}) => {
  const matched = score?.matched_skills
    ? score.matched_skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const missing = score?.missing_skills
    ? score.missing_skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div
      className={`group relative p-5 bg-surface-card border rounded-2xl transition-all duration-200 hover:-translate-y-0.5 ${
        isSelectedForCompare
          ? 'border-accent-red ring-1 ring-accent-red shadow-glow-subtle'
          : 'border-border-subtle hover:border-border-hover shadow-card'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Candidate Info & Rank */}
        <div className="flex items-start gap-4 flex-1">
          {rank !== undefined && (
            <div className="w-8 h-8 rounded-xl bg-surface border border-border-subtle flex items-center justify-center font-mono font-bold text-xs text-primary-secondary shrink-0 group-hover:border-accent-red/40 transition-colors">
              #{rank}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3
                onClick={() => onViewProfile(candidate.id)}
                className="text-base font-bold text-white hover:text-accent-red transition-colors cursor-pointer truncate"
              >
                {candidate.name}
              </h3>
              {score && <ScoreBadge score={score.overall_score} size="sm" />}
              <span
                className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                  candidate.status === 'shortlisted'
                    ? 'bg-status-success/15 text-status-success border border-status-success/30'
                    : candidate.status === 'review'
                    ? 'bg-status-warning/15 text-status-warning border border-status-warning/30'
                    : candidate.status === 'rejected'
                    ? 'bg-status-danger/15 text-status-danger border border-status-danger/30'
                    : 'bg-surface text-primary-muted border border-border-subtle'
                }`}
              >
                {candidate.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-primary-secondary">
              <span className="flex items-center gap-1.5 font-medium text-white/90">
                <Briefcase className="w-3.5 h-3.5 text-accent-red" />
                {candidate.current_role || 'Software Engineer'} ({candidate.experience_years.toFixed(1)} yrs)
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-primary-muted" />
                {candidate.education_level || "Bachelor's"}
              </span>
              {candidate.email && (
                <span className="flex items-center gap-1.5 text-primary-muted truncate max-w-[200px]">
                  <Mail className="w-3.5 h-3.5" />
                  {candidate.email}
                </span>
              )}
            </div>

            {/* Matched & Missing Skills Tags */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {matched.slice(0, 5).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-status-success/10 text-status-success border border-status-success/20"
                >
                  <CheckCircle className="w-2.5 h-2.5" /> {s}
                </span>
              ))}
              {matched.length > 5 && (
                <span className="text-[11px] text-primary-muted font-mono">
                  +{matched.length - 5} more
                </span>
              )}

              {missing.slice(0, 2).map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/20"
                >
                  <AlertTriangle className="w-2.5 h-2.5" /> Missing: {s}
                </span>
              ))}
            </div>

            {/* AI Recommendation Snippet */}
            {score && (
              <p className="mt-2 text-xs text-primary-secondary line-clamp-1 italic">
                "{score.recommendation}"
              </p>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-border-subtle shrink-0">
          {onSelectForCompare && (
            <button
              onClick={onSelectForCompare}
              className={`p-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                isSelectedForCompare
                  ? 'bg-accent-red text-white border-accent-red'
                  : 'bg-surface text-primary-secondary border-border-subtle hover:text-white hover:border-border-hover'
              }`}
              title="Select to compare"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          )}

          {/* Quick status selector */}
          <select
            value={candidate.status}
            onChange={(e) => onStatusChange(candidate.id, e.target.value as any)}
            className="text-xs bg-surface border border-border-subtle rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-accent-red transition-colors cursor-pointer"
          >
            <option value="pending">Status: Pending</option>
            <option value="shortlisted">Status: Shortlisted</option>
            <option value="review">Status: Under Review</option>
            <option value="rejected">Status: Rejected</option>
          </select>

          <button
            onClick={() => onViewProfile(candidate.id)}
            className="p-2 rounded-xl bg-surface border border-border-subtle text-primary-secondary hover:text-white hover:border-accent-red transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Profile</span>
            <ChevronRight className="w-3 h-3 text-primary-muted" />
          </button>

          {onDelete && (
            <button
              onClick={() => onDelete(candidate.id)}
              className="p-2 rounded-xl bg-surface border border-border-subtle text-primary-muted hover:text-status-danger hover:border-status-danger/40 transition-colors"
              title="Delete candidate profile"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
