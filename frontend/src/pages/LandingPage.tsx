import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  BrainCircuit,
  BarChart3,
  Layers,
  Lock,
  ChevronRight,
  Users,
  Search,
  Sliders,
  Check
} from 'lucide-react';
import { ScoreBadge } from '../components/ScoreBadge';

interface LandingPageProps {
  onStartScreening: () => void;
  onExplorePlatform: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartScreening,
  onExplorePlatform,
}) => {
  return (
    <div className="min-h-screen bg-background text-primary selection:bg-accent-red selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden px-4 sm:px-6">
        {/* Cinematic dark glowing background blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent-red/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[250px] bg-accent-red/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-card border border-border-hover text-xs font-semibold text-primary-secondary mb-8 shadow-glow-subtle"
          >
            <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
            <span>Next-Gen Autonomous Candidate Screening</span>
            <span className="text-white font-mono text-[11px] bg-accent-red/20 px-2 py-0.5 rounded-full border border-accent-red/30">v1.0</span>
          </motion.div>

          {/* Large Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.08]"
          >
            Hire smarter. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-accent-red">
              Discover better talent.
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-primary-secondary max-w-2xl mx-auto leading-relaxed"
          >
            RESUMIND AI parses PDF & DOCX resumes, normalizes 250+ technical skills, and ranks applicants using a transparent 4-pillar weighted model.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={onStartScreening}
              className="px-8 py-3.5 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm transition-all shadow-glow-red hover:scale-105 flex items-center gap-2 group"
            >
              <span>Start Screening</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onExplorePlatform}
              className="px-8 py-3.5 rounded-xl bg-surface-card hover:bg-surface-cardHover border border-border-hover text-white font-semibold text-sm transition-all hover:border-accent-red/40"
            >
              Explore Platform
            </button>
          </motion.div>

          {/* Trust Banner */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-primary-muted font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-status-success" /> Zero Demographic Bias
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-accent-red" /> 4-Pillar Transparent Scoring
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-primary-secondary" /> Enterprise Data Retention
            </span>
          </div>
        </div>

        {/* 4. PRODUCT SHOWCASE PREVIEW */}
        <div className="max-w-5xl mx-auto mt-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="p-3 bg-surface-card/60 border border-border-hover rounded-3xl shadow-2xl backdrop-blur-xl"
          >
            <div className="bg-background rounded-2xl border border-border-subtle p-5 md:p-8 overflow-hidden">
              {/* Fake Dashboard Topbar */}
              <div className="flex items-center justify-between pb-6 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-status-danger" />
                  <div className="w-3 h-3 rounded-full bg-status-warning" />
                  <div className="w-3 h-3 rounded-full bg-status-success" />
                  <span className="text-xs font-mono text-primary-muted ml-2">RESUMIND_SCREENING_WORKSPACE_LIVE</span>
                </div>
                <div className="text-xs font-mono px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-accent-red">
                  Active Screening: Senior Full-Stack AI Engineer
                </div>
              </div>

              {/* Showcase Candidate Card */}
              <div className="mt-6 p-6 rounded-2xl bg-surface-card border border-accent-red/30 shadow-glow-subtle">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface border border-border-hover flex items-center justify-center font-mono font-bold text-lg text-white">
                      AM
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-white">Alex Morgan</h4>
                        <ScoreBadge score={93.5} size="sm" />
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-status-success/20 text-status-success border border-status-success/30">
                          Shortlisted
                        </span>
                      </div>
                      <p className="text-xs text-primary-secondary mt-0.5">
                        Senior Full-Stack Engineer • 5.5 Years Exp • B.S. in Computer Science (UC Berkeley)
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-primary-muted">Rank #1 Candidate</div>
                    <div className="text-xl font-bold font-mono text-status-success">93.5 / 100</div>
                  </div>
                </div>

                {/* Score Breakdown Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                  <div className="p-3 bg-surface rounded-xl border border-border-subtle">
                    <div className="text-[11px] text-primary-muted">Skills (50%)</div>
                    <div className="text-sm font-bold font-mono text-status-success">96.0%</div>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border-subtle">
                    <div className="text-[11px] text-primary-muted">Experience (30%)</div>
                    <div className="text-sm font-bold font-mono text-blue-400">92.5%</div>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border-subtle">
                    <div className="text-[11px] text-primary-muted">Education (10%)</div>
                    <div className="text-sm font-bold font-mono text-purple-400">90.0%</div>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border-subtle">
                    <div className="text-[11px] text-primary-muted">Projects (10%)</div>
                    <div className="text-sm font-bold font-mono text-amber-400">90.0%</div>
                  </div>
                </div>

                {/* Matched skills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-primary-muted font-semibold mr-1">Matched:</span>
                  {['Python', 'FastAPI', 'React', 'TypeScript', 'SQL', 'Docker', 'PostgreSQL'].map((s) => (
                    <span key={s} className="text-xs px-2.5 py-0.5 rounded bg-status-success/15 text-status-success border border-status-success/30 font-medium">
                      ✓ {s}
                    </span>
                  ))}
                </div>

                {/* Explainable AI snippet */}
                <div className="mt-4 p-3 rounded-xl bg-surface border border-border-subtle text-xs text-primary-secondary">
                  <strong className="text-accent-red font-semibold">Explainable AI Recommendation:</strong> Demonstrates 100% of all required core competencies plus key preferred skills (PostgreSQL, Redis). 5.5 years exceeds the 4-year tenure baseline. Highly recommended for technical interview.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-20 bg-surface/50 border-t border-border-subtle px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent-red mb-3">Workflow Engine</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">How RESUMIND AI Works</h3>
            <p className="mt-3 text-sm text-primary-secondary">
              A 4-step autonomous pipeline built to eliminate resume screening bottlenecks while upholding strict ethical standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle relative group hover:border-accent-red/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-accent-red/10 border border-accent-red/30 flex items-center justify-center text-accent-red font-bold font-mono mb-4">
                01
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Upload Resumes</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                Drag and drop batch PDF and DOCX files. Multi-format parser extracts clean text and structural entities securely.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle relative group hover:border-accent-red/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold font-mono mb-4">
                02
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Analyze Candidates</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                Heuristic NLP models normalize 250+ tech skills, compute tenure from date intervals, and verify degrees.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle relative group hover:border-accent-red/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold font-mono mb-4">
                03
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Rank Applicants</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                Calculates weighted 4-pillar scores (Skills 50%, Exp 30%, Edu 10%, Proj 10%) and generates an explainable leaderboard.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle relative group hover:border-accent-red/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-status-success/10 border border-status-success/30 flex items-center justify-center text-status-success font-bold font-mono mb-4">
                04
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Review & Decide</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                Recruiters retain 100% human-in-the-loop authority. Shortlist, compare candidates side-by-side, or export CSV audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES GRID */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-accent-red mb-3">Enterprise Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">Precision Document Intelligence</h3>
            <p className="mt-3 text-sm text-primary-secondary">
              Everything engineering managers and talent leaders need to evaluate candidates at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors">
              <FileText className="w-8 h-8 text-accent-red mb-4" />
              <h4 className="text-base font-bold text-white mb-2">AI Resume Parsing</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                High-fidelity extraction for complex resumes, tables, formatting quirks, and varying date patterns across PDF and Word docs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors">
              <Sliders className="w-8 h-8 text-status-success mb-4" />
              <h4 className="text-base font-bold text-white mb-2">Intelligent Ranking</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                Weighted scoring aligns candidates directly against your specific job description without arbitrary black-box outputs.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors">
              <Layers className="w-8 h-8 text-blue-400 mb-4" />
              <h4 className="text-base font-bold text-white mb-2">Skills Normalization</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                Maps synonyms seamlessly: "React.js" and "reactjs" to React, "python3" to Python, "k8s" to Kubernetes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors">
              <BarChart3 className="w-8 h-8 text-purple-400 mb-4" />
              <h4 className="text-base font-bold text-white mb-2">Experience Analysis</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                Aggregates and calculates true years of experience across multiple historical positions with overlapping date deduction.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors">
              <Search className="w-8 h-8 text-amber-400 mb-4" />
              <h4 className="text-base font-bold text-white mb-2">Job Description Matching</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                Differentiates mandatory hard requirements from preferred bonus qualifications with individual score weighting.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors">
              <BrainCircuit className="w-8 h-8 text-accent-red mb-4" />
              <h4 className="text-base font-bold text-white mb-2">Explainable AI Recommendations</h4>
              <p className="text-xs text-primary-secondary leading-relaxed">
                Every percentage score is paired with natural language explanations explaining exactly why an applicant matched or fell short.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECURITY & PRIVACY */}
      <section className="py-20 bg-surface/40 border-t border-border-subtle px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="p-8 sm:p-12 rounded-3xl bg-surface-card border border-border-hover relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent-red/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border-subtle text-xs font-semibold text-status-success mb-4">
                <ShieldCheck className="w-4 h-4" /> Enterprise Security & Compliance
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Privacy-First Candidate Data Architecture
              </h3>
              <p className="mt-3 text-sm text-primary-secondary leading-relaxed">
                We believe AI in recruitment must be ethical, transparent, and under strict recruiter supervision.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-accent-red mt-0.5 shrink-0" />
                  <span className="text-xs text-primary-secondary">
                    <strong>Zero Demographic Scoring:</strong> Age, gender, religion, race, address, and photographs are explicitly excluded from mathematical models.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-accent-red mt-0.5 shrink-0" />
                  <span className="text-xs text-primary-secondary">
                    <strong>Instant Data Deletion:</strong> Recruiter retention controls allow complete purge of uploaded resume binaries and records in 1-click.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-accent-red mt-0.5 shrink-0" />
                  <span className="text-xs text-primary-secondary">
                    <strong>Human-in-the-Loop:</strong> No automated rejections or hiring decisions. The system provides decision-support only.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="py-24 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Your next great hire starts here.
          </h2>
          <p className="mt-4 text-base text-primary-secondary max-w-xl mx-auto">
            Experience the difference of explainable, bias-free AI resume screening today.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={onStartScreening}
              className="px-8 py-4 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm transition-all shadow-glow-red hover:scale-105 flex items-center gap-2 group"
            >
              <span>Get Started with RESUMIND AI</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border-subtle text-center text-xs text-primary-muted">
        <p>© 2026 RESUMIND AI. "Find the right talent. Faster. Smarter." Built for professional recruitment engineering.</p>
      </footer>
    </div>
  );
};
