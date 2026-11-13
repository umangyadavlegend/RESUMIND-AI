import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Sparkles,
  X,
  CheckCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { JobDescription } from '../types';

interface JobDescriptionsPageProps {
  onSelectJobForScreening: (job: JobDescription) => void;
}

export const JobDescriptionsPage: React.FC<JobDescriptionsPageProps> = ({
  onSelectJobForScreening,
}) => {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('Remote');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [minExperience, setMinExperience] = useState(2);
  const [minEducation, setMinEducation] = useState("Bachelor's");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await api.listJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requiredSkills.trim()) return;

    try {
      const created = await api.createJob({
        title,
        department,
        location,
        employment_type: employmentType,
        description: description || `Position description for ${title}`,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        min_experience_years: minExperience,
        min_education: minEducation,
      });
      setJobs([created, ...jobs]);
      setIsCreating(false);
      // Reset form
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error('Failed to create job', err);
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job description?')) return;
    try {
      await api.deleteJob(id);
      setJobs(jobs.filter((j) => j.id !== id));
    } catch (err) {
      console.error('Failed to delete job', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-card border border-border-subtle text-xs font-semibold text-accent-red mb-2">
            <Briefcase className="w-3.5 h-3.5" /> Target Position Catalog
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Job Descriptions
          </h1>
          <p className="text-xs text-primary-secondary mt-1">
            Define requirements and qualification criteria used by the matching engine.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 rounded-xl bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold transition-all shadow-glow-subtle flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Job Description</span>
        </button>
      </div>

      {/* Creation Modal / Inline Drawer */}
      {isCreating && (
        <div className="p-6 rounded-3xl bg-surface-card border border-border-hover shadow-2xl relative">
          <button
            onClick={() => setIsCreating(false)}
            className="absolute top-6 right-6 p-1.5 text-primary-muted hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-lg font-bold text-white mb-4">Create Job Criteria</h3>

          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lead Machine Learning Engineer"
                  className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-red"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Min. Experience (Years)
                </label>
                <input
                  type="number"
                  min={0}
                  value={minExperience}
                  onChange={(e) => setMinExperience(parseInt(e.target.value) || 0)}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-red"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Min. Education
                </label>
                <select
                  value={minEducation}
                  onChange={(e) => setMinEducation(e.target.value)}
                  className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-red"
                >
                  <option value="Associate Degree">Associate Degree</option>
                  <option value="Bachelor's">Bachelor's Degree</option>
                  <option value="Master's">Master's Degree</option>
                  <option value="Ph.D.">Ph.D.</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                Required Core Skills (Comma-separated)
              </label>
              <input
                type="text"
                required
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="Python, FastAPI, React, SQL, Docker"
                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                Preferred Skills (Comma-separated)
              </label>
              <input
                type="text"
                value={preferredSkills}
                onChange={(e) => setPreferredSkills(e.target.value)}
                placeholder="Kubernetes, AWS, Machine Learning"
                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
                Job Overview / Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe key responsibilities and mission..."
                className="w-full bg-surface border border-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-red"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl text-xs text-primary-secondary hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold"
              >
                Save Job Description
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="p-5 rounded-2xl bg-surface-card border border-border-subtle hover:border-border-hover transition-colors shadow-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{job.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-primary-muted">
                    <span>{job.department}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteJob(job.id)}
                  className="p-1.5 rounded-lg text-primary-muted hover:text-status-danger hover:bg-surface transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Required skills */}
              <div className="mt-4">
                <span className="text-[11px] font-bold text-primary-muted uppercase tracking-wider">Required Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {job.required_skills.split(',').map((s) => (
                    <span key={s} className="text-[11px] px-2 py-0.5 rounded bg-surface border border-border-subtle text-primary-secondary">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {job.preferred_skills && (
                <div className="mt-2.5">
                  <span className="text-[11px] font-bold text-primary-muted uppercase tracking-wider">Preferred:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.preferred_skills.split(',').map((s) => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-surface-subtle text-primary-muted">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border-subtle flex items-center justify-between">
              <span className="text-xs text-primary-muted font-mono">
                {job.min_experience_years}+ yrs exp • {job.min_education}
              </span>

              <button
                onClick={() => onSelectJobForScreening(job)}
                className="px-3.5 py-1.5 rounded-xl bg-accent-red/15 hover:bg-accent-red text-accent-red hover:text-white border border-accent-red/30 text-xs font-bold transition-all"
              >
                Screen with this Job
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
