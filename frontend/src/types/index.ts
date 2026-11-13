export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  company_name?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  message: string;
  status?: string;
  access_token?: string;
}

export interface LoginStep1Response {
  status: string;
  message: string;
  email: string;
}

export interface GenericResponse {
  status: string;
  message: string;
}

export interface JobDescription {
  id: number;
  user_id: number;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  required_skills: string;
  preferred_skills?: string;
  min_experience_years: number;
  min_education: string;
  created_at: string;
}

export interface ResumeItem {
  id: number;
  user_id: number;
  original_filename: string;
  file_size: number;
  file_type: string;
  created_at: string;
  extracted_text_preview?: string;
}

export interface CandidateScore {
  id: number;
  candidate_id: number;
  screening_id: number;
  overall_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  projects_score: number;
  matched_skills?: string;
  missing_skills?: string;
  explanation: string;
  recommendation: string;
  created_at: string;
}

export interface Candidate {
  id: number;
  user_id: number;
  resume_id?: number;
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  experience_years: number;
  education_level?: string;
  education_details?: string;
  current_role?: string;
  skills?: string;
  summary?: string;
  status: 'pending' | 'shortlisted' | 'review' | 'rejected';
  notes?: string;
  created_at: string;
  latest_score?: CandidateScore;
}

export interface CandidateDetail extends Candidate {
  resume_text?: string;
  scores: CandidateScore[];
}

export interface RankedCandidateItem {
  candidate: Candidate;
  score: CandidateScore;
  rank: number;
}

export interface ScreeningSession {
  id: number;
  user_id: number;
  job_id: number;
  title: string;
  status: 'processing' | 'completed' | 'failed';
  total_resumes: number;
  average_score: number;
  created_at: string;
  completed_at?: string;
  job?: JobDescription;
}

export interface ScreeningResults {
  session: ScreeningSession;
  candidates: RankedCandidateItem[];
}

export interface AnalyticsOverview {
  total_resumes: number;
  active_jobs: number;
  avg_match_score: number;
  candidates_pending_review: number;
  candidates_shortlisted: number;
  candidates_rejected: number;
  score_distribution: { range: string; count: number }[];
  top_skills_matched: { skill: string; count: number }[];
  recent_activity: {
    id: number;
    title: string;
    candidates_count: number;
    avg_score: number;
    status: string;
    date: string;
  }[];
  screening_performance: {
    job_title: string;
    screenings_count: number;
    average_score: number;
  }[];
}

export interface SystemStatus {
  status: string;
  app_name: string;
  version: string;
  database: string;
  nlp_engine: string;
  scoring_model: string;
  data_retention_policy: string;
  user_email: string;
  company: string;
}
