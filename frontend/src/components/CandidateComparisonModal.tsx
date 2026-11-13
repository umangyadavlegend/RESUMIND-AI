import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, ArrowRight, GitCompare } from 'lucide-react';
import { Candidate } from '../types';
import { ScoreBadge } from './ScoreBadge';

interface CandidateComparisonModalProps {
  candidates: [Candidate, Candidate] | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectCandidate: (id: number) => void;
}

export const CandidateComparisonModal: React.FC<CandidateComparisonModalProps> = ({
  candidates,
  isOpen,
  onClose,
  onSelectCandidate,
}) => {
  if (!isOpen || !candidates) return null;
  const [c1, c2] = candidates;

  const s1 = c1.latest_score;
  const s2 = c2.latest_score;

  const m1 = s1?.matched_skills ? s1.matched_skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const m2 = s2?.matched_skills ? s2.matched_skills.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const miss1 = s1?.missing_skills ? s1.missing_skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const miss2 = s2?.missing_skills ? s2.missing_skills.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-4xl bg-surface-card border border-border-hover rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-red/20 text-accent-red flex items-center justify-center border border-accent-red/30">
                <GitCompare className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white">Side-by-Side Candidate Comparison</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-primary-muted hover:text-white hover:bg-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Comparison */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Candidate 1 Header */}
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{c1.name}</h3>
                    <p className="text-xs text-primary-secondary">{c1.current_role}</p>
                  </div>
                  {s1 && <ScoreBadge score={s1.overall_score} size="md" />}
                </div>
              </div>

              {/* Candidate 2 Header */}
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{c2.name}</h3>
                    <p className="text-xs text-primary-secondary">{c2.current_role}</p>
                  </div>
                  {s2 && <ScoreBadge score={s2.overall_score} size="md" />}
                </div>
              </div>
            </div>

            {/* Score Comparison Bars */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-muted">
                Weighted Pillar Comparison
              </h4>

              {/* Skills */}
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <div className="text-xs font-semibold text-primary-secondary mb-2">Skills Score (50% Weight)</div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span>{c1.name.split(' ')[0]}</span>
                      <span className="font-bold text-status-success">{s1?.skills_score ?? 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-card rounded-full overflow-hidden">
                      <div className="h-full bg-status-success rounded-full" style={{ width: `${s1?.skills_score ?? 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span>{c2.name.split(' ')[0]}</span>
                      <span className="font-bold text-status-success">{s2?.skills_score ?? 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-card rounded-full overflow-hidden">
                      <div className="h-full bg-status-success rounded-full" style={{ width: `${s2?.skills_score ?? 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="p-4 rounded-xl bg-surface border border-border-subtle">
                <div className="text-xs font-semibold text-primary-secondary mb-2">Experience (30% Weight)</div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-bold font-mono text-white">{c1.experience_years.toFixed(1)} Years</div>
                    <div className="text-xs text-primary-muted">{c1.education_details || c1.education_level}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold font-mono text-white">{c2.experience_years.toFixed(1)} Years</div>
                    <div className="text-xs text-primary-muted">{c2.education_details || c2.education_level}</div>
                  </div>
                </div>
              </div>

              {/* Skills Overlap */}
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
                  <div>
                    <span className="text-xs font-bold text-status-success uppercase flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Matched ({m1.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m1.map((s) => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-status-success/10 text-status-success border border-status-success/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  {miss1.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-status-warning uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing ({miss1.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {miss1.map((s) => (
                          <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/20">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-surface border border-border-subtle space-y-3">
                  <div>
                    <span className="text-xs font-bold text-status-success uppercase flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Matched ({m2.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m2.map((s) => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-status-success/10 text-status-success border border-status-success/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  {miss2.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-status-warning uppercase flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing ({miss2.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {miss2.map((s) => (
                          <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-status-warning/10 text-status-warning border border-status-warning/20">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border-subtle flex justify-end gap-3">
            <button
              onClick={() => onSelectCandidate(c1.id)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-surface border border-border-hover text-white hover:border-accent-red transition-colors"
            >
              View {c1.name.split(' ')[0]}'s Profile
            </button>
            <button
              onClick={() => onSelectCandidate(c2.id)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-surface border border-border-hover text-white hover:border-accent-red transition-colors"
            >
              View {c2.name.split(' ')[0]}'s Profile
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
