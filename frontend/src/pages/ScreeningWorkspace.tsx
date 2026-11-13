import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Plus,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Briefcase,
  Layers,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';
import { ProcessingModal } from '../components/ProcessingModal';
import { ScreeningResults } from '../types';

interface ScreeningWorkspaceProps {
  onScreeningComplete: (results: ScreeningResults) => void;
}

export const ScreeningWorkspace: React.FC<ScreeningWorkspaceProps> = ({
  onScreeningComplete,
}) => {
  // Files state
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);

  // Job criteria state
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [minExperience, setMinExperience] = useState(2);
  const [minEducation, setMinEducation] = useState("Bachelor's");

  // Processing & Error states
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const allowed = ['.pdf', '.docx'];

    Array.from(newFiles).forEach((f) => {
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      if (!allowed.includes(ext)) {
        setErrorMessage(`File '${f.name}' has invalid format. Only .pdf and .docx are supported.`);
        return;
      }
      if (f.size > 15 * 1024 * 1024) {
        setErrorMessage(`File '${f.name}' exceeds the 15MB file size limit.`);
        return;
      }
      validFiles.push(f);
    });

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Skills tag manager with robust comma, tab, paste & enter parsing
  const parseAndAddSkills = (raw: string) => {
    if (!raw) return;
    const tokens = raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (tokens.length === 0) return;

    setRequiredSkills((prev) => {
      const next = [...prev];
      for (const tok of tokens) {
        if (!next.includes(tok)) {
          next.push(tok);
        }
      }
      return next;
    });
    setErrorMessage(null);
  };

  const handleSkillInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (errorMessage) setErrorMessage(null);

    // If user enters comma, semicolon, or newline, immediately parse completed tokens
    if (val.includes(',') || val.includes(';') || val.includes('\n')) {
      const tokens = val.split(/[,;\n]+/);
      const endsWithDelimiter = /[,;\n]\s*$/.test(val);
      if (endsWithDelimiter) {
        parseAndAddSkills(val);
        setNewSkillInput('');
      } else {
        const complete = tokens.slice(0, -1).join(',');
        parseAndAddSkills(complete);
        setNewSkillInput(tokens[tokens.length - 1]);
      }
    } else {
      setNewSkillInput(val);
    }
  };

  const handleSkillPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData('text');
    if (paste && (paste.includes(',') || paste.includes(';') || paste.includes('\n'))) {
      e.preventDefault();
      const combined = (newSkillInput ? newSkillInput + ', ' : '') + paste;
      parseAndAddSkills(combined);
      setNewSkillInput('');
      if (errorMessage) setErrorMessage(null);
    }
  };

  const handleAddSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      if (newSkillInput.trim()) {
        parseAndAddSkills(newSkillInput);
        setNewSkillInput('');
      }
    } else if (e.key === 'Backspace' && !newSkillInput && requiredSkills.length > 0) {
      // Convenient backspace to pop last chip when input empty
      setRequiredSkills((prev) => prev.slice(0, -1));
    }
  };

  const handleSkillBlur = () => {
    if (newSkillInput.trim()) {
      parseAndAddSkills(newSkillInput);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRequiredSkills((prev) => prev.filter((s) => s !== skill));
  };

  // Screening pipeline execution
  const handleAnalyze = async () => {
    setErrorMessage(null);
    if (files.length === 0) {
      setErrorMessage('Please upload at least one PDF or DOCX resume to start screening.');
      return;
    }
    if (!jobTitle.trim()) {
      setErrorMessage('Please enter a target Job Title.');
      return;
    }

    // Automatically incorporate any skills still typed in the input box
    let effectiveSkills = [...requiredSkills];
    if (newSkillInput.trim()) {
      const parsed = newSkillInput
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const tok of parsed) {
        if (!effectiveSkills.includes(tok)) {
          effectiveSkills.push(tok);
        }
      }
      setRequiredSkills(effectiveSkills);
      setNewSkillInput('');
    }

    if (effectiveSkills.length === 0) {
      setErrorMessage('Please specify at least one required skill tag (e.g. SQL, Python, Excel).');
      return;
    }

    try {
      setIsProcessing(true);
      setCurrentStep(1);

      // Step 1: Upload resumes to backend
      const uploadResults = await api.uploadResumes(files);
      const resumeIds = uploadResults.map((r) => r.id);

      // Step 2 & 3: Simulate realistic step progression for human perception
      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 600));

      setCurrentStep(3);
      await new Promise((r) => setTimeout(r, 600));

      setCurrentStep(4);
      await new Promise((r) => setTimeout(r, 600));

      setCurrentStep(5);
      // Real API execution: match and calculate 4-pillar scores
      const screeningResults = await api.analyzeScreening({
        job_title: jobTitle,
        job_description: jobDescription,
        required_skills: effectiveSkills.join(', '),
        preferred_skills: preferredSkills,
        min_experience_years: minExperience,
        min_education: minEducation,
        resume_ids: resumeIds,
      });

      setCurrentStep(6);
      await new Promise((r) => setTimeout(r, 700));

      // Done! Forward to candidate ranking page
      setIsProcessing(false);
      onScreeningComplete(screeningResults);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'An error occurred during screening pipeline execution.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs font-semibold text-accent-red mb-3">
          <Sparkles className="w-3.5 h-3.5" /> High-Throughput Screening Workspace
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Screen & Rank Candidates
        </h1>
        <p className="text-sm text-primary-secondary mt-1">
          Upload applicant resumes and specify target role parameters to run the 6-stage explainable AI matching engine.
        </p>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-status-danger/10 border border-status-danger/30 text-sm text-status-danger flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Resume Upload Dropzone */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary-muted flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-accent-red" /> 1. Upload Resumes
          </h2>

          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[260px] ${
              isDragging
                ? 'border-accent-red bg-accent-red/10 scale-[1.01]'
                : 'border-border-hover bg-surface-card/60 hover:border-accent-red/40 hover:bg-surface-card'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              accept=".pdf,.docx"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-surface border border-border-hover flex items-center justify-center text-accent-red mb-4 shadow-card">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-white">
              Drag & drop resumes here, or <span className="text-accent-red underline">browse</span>
            </p>
            <p className="text-xs text-primary-muted mt-1.5">
              Supports multiple PDF and DOCX files up to 15MB each
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-primary-muted">
              <span className="px-2 py-0.5 rounded bg-surface border border-border-subtle">.PDF</span>
              <span className="px-2 py-0.5 rounded bg-surface border border-border-subtle">.DOCX</span>
            </div>
          </div>

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-semibold text-primary-secondary">
                <span>Selected Resumes ({files.length})</span>
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="text-status-danger hover:underline text-[11px]"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-border-subtle"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-accent-red shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-primary-muted font-mono">
                          {(file.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      className="p-1.5 rounded-lg text-primary-muted hover:text-status-danger hover:bg-surface transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Job Description & Criteria */}
        <div className="lg:col-span-7 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary-muted flex items-center gap-2">
            <Sliders className="w-4 h-4 text-accent-red" /> 2. Target Job Criteria
          </h2>

          <div className="p-6 rounded-3xl bg-surface-card border border-border-hover space-y-5 shadow-card">
            {/* Job Title */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Target Role / Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Full-Stack AI Engineer"
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
              />
            </div>

            {/* Required Skills (Tag Input) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  Required Core Skills (50% Weight)
                </label>
                <span className="text-[11px] text-primary-muted">Separate by commas, Enter, or paste list</span>
              </div>

              {/* Tag chips */}
              <div
                onClick={() => skillInputRef.current?.focus()}
                className="flex flex-wrap items-center gap-2 p-3 bg-surface border border-border-subtle rounded-xl min-h-[48px] cursor-text focus-within:border-accent-red transition-colors"
              >
                {requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-accent-red/15 text-accent-red border border-accent-red/30 font-semibold select-none"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSkill(skill);
                      }}
                      className="hover:text-white transition-colors"
                      title="Remove skill"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={skillInputRef}
                  type="text"
                  value={newSkillInput}
                  onChange={handleSkillInputChange}
                  onKeyDown={handleAddSkillKeyDown}
                  onPaste={handleSkillPaste}
                  onBlur={handleSkillBlur}
                  placeholder={
                    requiredSkills.length === 0
                      ? "Type skills (e.g. SQL, Python, Excel) separated by commas or Enter..."
                      : "Add more skills..."
                  }
                  className="bg-transparent text-xs text-white placeholder-primary-muted focus:outline-none flex-1 min-w-[140px]"
                />
              </div>
            </div>

            {/* Preferred Skills */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Preferred Bonus Skills (Optional)
              </label>
              <input
                type="text"
                value={preferredSkills}
                onChange={(e) => setPreferredSkills(e.target.value)}
                placeholder="e.g. Kubernetes, AWS, Machine Learning, Redis"
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
              />
            </div>

            {/* Experience & Education row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                  Min. Experience (Years)
                </label>
                <input
                  type="number"
                  min={0}
                  max={25}
                  value={minExperience}
                  onChange={(e) => setMinExperience(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-red transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                  Target Education Level
                </label>
                <select
                  value={minEducation}
                  onChange={(e) => setMinEducation(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                >
                  <option value="Associate Degree">Associate Degree</option>
                  <option value="Bachelor's">Bachelor's Degree</option>
                  <option value="Master's">Master's Degree</option>
                  <option value="Ph.D.">Ph.D. / Doctorate</option>
                </select>
              </div>
            </div>

            {/* Job Description Text */}
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Job Context / Overview
              </label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-red transition-colors leading-relaxed"
              />
            </div>

            {/* Analyze Trigger Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-accent-red hover:bg-accent-redHover text-white font-extrabold text-sm transition-all shadow-glow-red hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5" />
                <span>
                  {files.length > 0 ? `Analyze & Rank ${files.length} Candidates` : 'Analyze Candidates'}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6-Stage Animated Processing Modal */}
      <ProcessingModal
        isOpen={isProcessing}
        currentStep={currentStep}
        totalResumes={files.length}
      />
    </div>
  );
};
