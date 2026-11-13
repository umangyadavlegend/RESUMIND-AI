import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Sparkles, BrainCircuit } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
  currentStep: number;
  totalResumes: number;
}

const STAGES = [
  { id: 1, title: 'Reading resume documents', desc: 'Validating PDF and DOCX binary streams' },
  { id: 2, title: 'Extracting candidate profiles', desc: 'Parsing contact, tenure, education & career history' },
  { id: 3, title: 'Identifying & normalizing skills', desc: 'Standardizing synonyms across 250+ tech taxonomies' },
  { id: 4, title: 'Comparing job requirements', desc: 'Evaluating required vs preferred qualifications' },
  { id: 5, title: 'Calculating 4-pillar match scores', desc: 'Skills (50%), Exp (30%), Edu (10%), Projects (10%)' },
  { id: 6, title: 'Generating candidate ranking', desc: 'Synthesizing explainable AI decision support' },
];

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  currentStep,
  totalResumes,
}) => {
  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round((currentStep / STAGES.length) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-surface-card border border-border-hover rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden"
        >
          {/* Subtle accent glow backdrop */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-red/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-red/15 border border-accent-red/30 flex items-center justify-center text-accent-red">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Screening Pipeline Active
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-red/20 text-accent-red border border-accent-red/30">
                  {totalResumes} {totalResumes === 1 ? 'Resume' : 'Resumes'}
                </span>
              </h3>
              <p className="text-xs text-primary-secondary">
                Analyzing qualifications with explainable AI heuristic models
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="text-primary-secondary font-medium">Pipeline Progress</span>
              <span className="font-mono text-white font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border-subtle">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-red to-accent-redHover rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* 6 Stages Checklist */}
          <div className="space-y-3 mb-6">
            {STAGES.map((stage) => {
              const isCompleted = currentStep > stage.id;
              const isCurrent = currentStep === stage.id;
              const isPending = currentStep < stage.id;

              return (
                <div
                  key={stage.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-surface border-accent-red/40 shadow-glow-subtle'
                      : isCompleted
                      ? 'bg-surface-subtle/50 border-border-subtle opacity-90'
                      : 'border-transparent opacity-40'
                  }`}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-accent-red animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border-subtle flex items-center justify-center text-[10px] text-primary-muted font-mono">
                        {stage.id}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-primary-secondary'}`}>
                      {stage.title}
                    </p>
                    <p className="text-xs text-primary-muted mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ethical disclaimer badge */}
          <div className="flex items-center gap-2 p-3 bg-surface-subtle rounded-xl border border-border-subtle text-xs text-primary-secondary">
            <Sparkles className="w-4 h-4 text-accent-red shrink-0" />
            <span>
              <strong>Ethical AI Guardrails Active:</strong> Scoring is strictly skill and experience based. Zero demographic inference.
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
