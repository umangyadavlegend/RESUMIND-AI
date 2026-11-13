import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Sparkles,
  Download,
  Share2
} from 'lucide-react';
import { CandidateDetail } from '../types';
import { ScoreBadge } from './ScoreBadge';

interface CandidateDetailModalProps {
  candidate: CandidateDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: 'pending' | 'shortlisted' | 'review' | 'rejected') => Promise<void>;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resume'>('overview');
  const [updating, setUpdating] = useState(false);

  if (!isOpen || !candidate) return null;

  const score = candidate.latest_score || (candidate.scores && candidate.scores[0]);
  const matchedSkills = score?.matched_skills ? score.matched_skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const missingSkills = score?.missing_skills ? score.missing_skills.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const allSkills = candidate.skills ? candidate.skills.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const handleStatus = async (status: 'shortlisted' | 'review' | 'rejected') => {
    try {
      setUpdating(true);
      await onStatusChange(candidate.id, status);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-surface-card border border-border-hover rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-border-subtle flex items-start justify-between bg-surface-subtle/40">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-surface to-surface-card border border-border-hover flex items-center justify-center text-xl font-bold font-mono text-white shadow-card">
                {candidate.name ? candidate.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'C'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">{candidate.name}</h2>
                  {score && <ScoreBadge score={score.overall_score} size="md" />}
                </div>
                <p className="text-sm text-primary-secondary mt-0.5">{candidate.current_role || 'Software Engineer'}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-primary-muted">
                  {candidate.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {candidate.email}
                    </span>
                  )}
                  {candidate.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {candidate.phone}
                    </span>
                  )}
                  {candidate.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {candidate.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-primary-muted hover:text-white hover:bg-surface border border-transparent hover:border-border-subtle transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-border-subtle flex gap-4 bg-surface-subtle/20">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-accent-red text-white'
                  : 'border-transparent text-primary-secondary hover:text-white'
              }`}
            >
              Candidate Analysis & Scores
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`py-3 text-sm font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'resume'
                  ? 'border-accent-red text-white'
                  : 'border-transparent text-primary-secondary hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" /> Raw Resume Document
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'overview' ? (
              <>
                {/* 4-Pillar Score Cards */}
                {score && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary-muted mb-3">
                      4-Pillar Transparent Scoring Model
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-surface rounded-xl border border-border-subtle">
                        <div className="flex justify-between items-center text-xs text-primary-secondary mb-1">
                          <span>Skills (50%)</span>
                          <span className="font-mono text-white font-bold">{Math.round(score.skills_score)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                          <div
                            className="h-full bg-status-success rounded-full"
                            style={{ width: `${score.skills_score}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-3.5 bg-surface rounded-xl border border-border-subtle">
                        <div className="flex justify-between items-center text-xs text-primary-secondary mb-1">
                          <span>Experience (30%)</span>
                          <span className="font-mono text-white font-bold">{Math.round(score.experience_score)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${score.experience_score}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-3.5 bg-surface rounded-xl border border-border-subtle">
                        <div className="flex justify-between items-center text-xs text-primary-secondary mb-1">
                          <span>Education (10%)</span>
                          <span className="font-mono text-white font-bold">{Math.round(score.education_score)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${score.education_score}%` }}
                          />
                        </div>
                      </div>

                      <div className="p-3.5 bg-surface rounded-xl border border-border-subtle">
                        <div className="flex justify-between items-center text-xs text-primary-secondary mb-1">
                          <span>Projects (10%)</span>
                          <span className="font-mono text-white font-bold">{Math.round(score.projects_score)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-surface-card rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${score.projects_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Rationale & Decision Support Recommendation */}
                {score && (
                  <div className="p-4 rounded-xl bg-surface border border-accent-red/20 space-y-3">
                    <div className="flex items-center gap-2 text-accent-red text-sm font-bold">
                      <Sparkles className="w-4 h-4" /> Explainable AI Recommendation
                    </div>
                    <div className="text-sm text-primary-secondary whitespace-pre-line leading-relaxed font-sans">
                      {score.explanation}
                    </div>
                    <div className="pt-2 border-t border-border-subtle text-xs text-white bg-accent-red/5 p-3 rounded-lg border border-accent-red/20">
                      <strong>Decision Support:</strong> {score.recommendation}
                    </div>
                  </div>
                )}

                {/* Skills Breakdown */}
                <div className="space-y-4">
                  {matchedSkills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-status-success mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Matched Required Skills ({matchedSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {matchedSkills.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2.5 py-1 rounded-full bg-status-success/10 border border-status-success/30 text-status-success font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {missingSkills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-status-warning mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing Skills Identified ({missingSkills.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {missingSkills.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-2.5 py-1 rounded-full bg-status-warning/10 border border-status-warning/30 text-status-warning font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary-muted mb-2">
                      All Extracted Competencies ({allSkills.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {allSkills.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border-subtle text-primary-secondary"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Career & Education Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
                      <Briefcase className="w-4 h-4 text-accent-red" /> Experience Standing
                    </div>
                    <p className="text-lg font-bold font-mono text-white">
                      {candidate.experience_years.toFixed(1)} Years
                    </p>
                    <p className="text-xs text-primary-secondary mt-1">
                      Current: {candidate.current_role || 'Software Engineer'}
                    </p>
                  </div>

                  <div className="p-4 bg-surface rounded-xl border border-border-subtle">
                    <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
                      <GraduationCap className="w-4 h-4 text-accent-red" /> Education Background
                    </div>
                    <p className="text-lg font-bold text-white">
                      {candidate.education_level || "Bachelor's"}
                    </p>
                    <p className="text-xs text-primary-secondary mt-1">
                      {candidate.education_details || 'Computer Science or relevant domain'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* Raw Resume Preview */
              <div className="p-4 bg-surface rounded-xl border border-border-subtle font-mono text-xs text-primary-secondary whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto selection:bg-accent-red selection:text-white">
                {candidate.resume_text || 'No raw resume text stored for this candidate.'}
              </div>
            )}
          </div>

          {/* Footer Actions — Recruiter Human Review Controls */}
          <div className="p-4 sm:p-6 border-t border-border-subtle bg-surface-subtle/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-primary-muted">
              <span>Recruiter Status:</span>
              <span
                className={`font-bold uppercase px-2 py-0.5 rounded ${
                  candidate.status === 'shortlisted'
                    ? 'bg-status-success/20 text-status-success'
                    : candidate.status === 'review'
                    ? 'bg-status-warning/20 text-status-warning'
                    : candidate.status === 'rejected'
                    ? 'bg-status-danger/20 text-status-danger'
                    : 'bg-surface text-primary-secondary'
                }`}
              >
                {candidate.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={updating}
                onClick={() => handleStatus('rejected')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-status-danger/30 text-status-danger hover:bg-status-danger/10 transition-colors"
              >
                Reject Candidate
              </button>
              <button
                disabled={updating}
                onClick={() => handleStatus('review')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-status-warning/30 text-status-warning hover:bg-status-warning/10 transition-colors"
              >
                Mark for Review
              </button>
              <button
                disabled={updating}
                onClick={() => handleStatus('shortlisted')}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-status-success text-black hover:bg-status-success/90 transition-colors shadow-glow-subtle flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Shortlist Candidate
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
