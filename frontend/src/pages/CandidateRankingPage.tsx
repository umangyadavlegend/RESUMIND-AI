import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  GitCompare,
  SlidersHorizontal,
  Sparkles,
  Users,
  CheckCircle,
  FileDown,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { CandidateCard } from '../components/CandidateCard';
import { CandidateDetailModal } from '../components/CandidateDetailModal';
import { CandidateComparisonModal } from '../components/CandidateComparisonModal';
import { api } from '../services/api';
import { Candidate, CandidateDetail, ScreeningResults, RankedCandidateItem } from '../types';

interface CandidateRankingPageProps {
  initialResults?: ScreeningResults | null;
  onNavigateToWorkspace: () => void;
}

export const CandidateRankingPage: React.FC<CandidateRankingPageProps> = ({
  initialResults,
  onNavigateToWorkspace,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'experience' | 'name'>('score');

  // Modal states
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Active session title
  const sessionTitle = initialResults?.session?.title || 'Screening Leaderboard';

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const data = await api.listCandidates({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery.trim() || undefined,
      });
      setCandidates(data);
    } catch (err) {
      console.error('Failed to load candidates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialResults?.candidates && initialResults.candidates.length > 0) {
      setCandidates((initialResults?.candidates || []).map((item) => item.candidate));
      setLoading(false);
    } else {
      fetchCandidates();
    }
  }, [initialResults]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  // Status update with optimistic feedback and backend sync
  const handleStatusChange = async (id: number, status: 'pending' | 'shortlisted' | 'review' | 'rejected') => {
    // 1. Instant optimistic update so UI changes immediately
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
    if (selectedCandidate && selectedCandidate.id === id) {
      setSelectedCandidate({ ...selectedCandidate, status });
    }

    try {
      const updated = await api.updateCandidateStatus(id, status);
      setCandidates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: updated.status } : c))
      );
    } catch (err) {
      console.error('Failed to update status on server', err);
      fetchCandidates();
    }
  };

  // Delete candidate with instant optimistic removal
  const handleDeleteCandidate = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this candidate profile?')) return;
    
    // 1. Instant optimistic removal from UI
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    if (selectedCandidate && selectedCandidate.id === id) {
      setIsDetailOpen(false);
      setSelectedCandidate(null);
    }
    setCompareIds((prev) => prev.filter((cid) => cid !== id));

    try {
      await api.deleteCandidate(id);
    } catch (err) {
      console.warn('Delete candidate server error (may already be removed):', err);
    }
  };

  // Open profile modal
  const handleViewProfile = async (id: number) => {
    try {
      const detail = await api.getCandidate(id);
      setSelectedCandidate(detail);
      setIsDetailOpen(true);
    } catch (err) {
      console.error('Failed to load candidate details', err);
    }
  };

  // Comparison logic
  const handleToggleCompare = (id: number) => {
    if (compareIds.includes(id)) {
      setCompareIds(compareIds.filter((cid) => cid !== id));
    } else {
      if (compareIds.length >= 2) {
        setCompareIds([compareIds[1], id]);
      } else {
        setCompareIds([...compareIds, id]);
      }
    }
  };

  const handleLaunchComparison = () => {
    if (compareIds.length === 2) {
      setIsCompareOpen(true);
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    try {
      const sessionId = initialResults?.session?.id || 0;
      const blob = await api.exportReportCSV(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RESUMIND_Screening_Report_${sessionId || 'Export'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Failed to export CSV', err);
    }
  };

  // Filtered and sorted candidates
  const filteredCandidates = candidates.filter((c) => {
    if (statusFilter !== 'all' && c.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = c.name.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchRole = c.current_role?.toLowerCase().includes(q);
      const matchSkills = c.skills?.toLowerCase().includes(q);
      return matchName || matchEmail || matchRole || matchSkills;
    }
    return true;
  });

  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    if (sortBy === 'score') {
      const sa = a.latest_score?.overall_score ?? 0;
      const sb = b.latest_score?.overall_score ?? 0;
      return sb - sa;
    } else if (sortBy === 'experience') {
      return b.experience_years - a.experience_years;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  const c1 = compareIds.length === 2 ? candidates.find((c) => c.id === compareIds[0]) : null;
  const c2 = compareIds.length === 2 ? candidates.find((c) => c.id === compareIds[1]) : null;
  const comparedPair: [Candidate, Candidate] | null = c1 && c2 ? [c1, c2] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs font-semibold text-accent-red mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Explainable AI Ranking
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {sessionTitle}
          </h1>
          <p className="text-xs text-primary-secondary mt-1">
            Ranked candidate leaderboard scored across 4 weighted pillars with explainable recommendations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {compareIds.length > 0 && (
            <button
              onClick={handleLaunchComparison}
              disabled={compareIds.length !== 2}
              className="px-4 py-2 rounded-xl bg-surface border border-accent-red text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:border-border-subtle"
            >
              <GitCompare className="w-4 h-4 text-accent-red" />
              <span>Compare Selected ({compareIds.length}/2)</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-cardHover border border-border-subtle hover:border-border-hover text-primary-secondary hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-card"
          >
            <Download className="w-4 h-4 text-accent-red" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onNavigateToWorkspace}
            className="px-4 py-2 rounded-xl bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold transition-all shadow-glow-subtle flex items-center gap-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Screen More</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-surface-card border border-border-subtle shadow-card flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or skill..."
            className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-accent-red transition-colors"
          />
        </form>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Status selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-primary-muted mr-1">Status:</span>
            {['all', 'pending', 'shortlisted', 'review', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[11px] transition-colors ${
                  statusFilter === st
                    ? 'bg-accent-red text-white'
                    : 'bg-surface text-primary-secondary hover:text-white border border-border-subtle'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-surface border border-border-subtle text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-accent-red"
          >
            <option value="score">Sort: Highest Match Score</option>
            <option value="experience">Sort: Years of Experience</option>
            <option value="name">Sort: Candidate Name</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-primary-muted">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-accent-red" />
            <p className="text-xs">Loading candidate evaluations...</p>
          </div>
        ) : sortedCandidates.length === 0 ? (
          <div className="p-12 text-center bg-surface-card rounded-2xl border border-border-subtle">
            <Users className="w-10 h-10 text-primary-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Candidates Found</h3>
            <p className="text-xs text-primary-secondary mt-1 max-w-sm mx-auto">
              No applicant resumes match your active filters or search criteria.
            </p>
            <button
              onClick={onNavigateToWorkspace}
              className="mt-4 px-4 py-2 rounded-xl bg-accent-red text-white text-xs font-bold"
            >
              Upload Resumes Now
            </button>
          </div>
        ) : (
          sortedCandidates.map((cand, idx) => (
            <CandidateCard
              key={cand.id}
              candidate={cand}
              rank={idx + 1}
              isSelectedForCompare={compareIds.includes(cand.id)}
              onSelectForCompare={() => handleToggleCompare(cand.id)}
              onViewProfile={handleViewProfile}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteCandidate}
            />
          ))
        )}
      </div>

      {/* Candidate Profile Detail Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onStatusChange={handleStatusChange}
      />

      {/* Side-by-Side Comparison Modal */}
      <CandidateComparisonModal
        candidates={comparedPair}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        onSelectCandidate={(id) => {
          setIsCompareOpen(false);
          handleViewProfile(id);
        }}
      />
    </div>
  );
};
