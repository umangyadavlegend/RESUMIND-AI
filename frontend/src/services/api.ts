import {
  AuthResponse,
  LoginStep1Response,
  GenericResponse,
  User,
  JobDescription,
  ResumeItem,
  Candidate,
  CandidateDetail,
  ScreeningSession,
  ScreeningResults,
  AnalyticsOverview,
  SystemStatus
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      // Notify application of session invalidation/expiration
      window.dispatchEvent(new CustomEvent('resumind:unauthorized'));
    }
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  // HTTP 204 No Content has no body
  if (res.status === 204) {
    return {} as T;
  }
  const text = await res.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export const api = {
  // Authentication (Uses secure HttpOnly cookies exclusively — no localStorage tokens)
  async register(data: {
    full_name: string;
    email: string;
    phone_number?: string;
    company_name?: string;
    password: string;
    confirm_password: string;
  }): Promise<{ status: string; message: string; email: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async verifyRegistrationOtp(data: { email: string; otp: string }): Promise<{ status: string; message: string; user?: User }> {
    const res = await fetch(`${API_BASE}/auth/verify-registration-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async login(data: { email: string; password: string }): Promise<LoginStep1Response> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<LoginStep1Response>(res);
  },

  async verifyLoginOtp(data: { email: string; otp: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async resendOtp(data: { email: string; purpose: 'registration' | 'login' | 'reset' }): Promise<GenericResponse> {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<GenericResponse>(res);
  },

  async forgotPassword(data: { email: string }): Promise<GenericResponse> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<GenericResponse>(res);
  },

  async verifyResetOtp(data: { email: string; otp: string }): Promise<GenericResponse> {
    const res = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<GenericResponse>(res);
  },

  async resetPassword(data: {
    email: string;
    otp: string;
    new_password: string;
    confirm_password: string;
  }): Promise<GenericResponse> {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<GenericResponse>(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });
    return handleResponse<User>(res);
  },

  async getDevMailbox(email?: string): Promise<{ status: string; count: number; emails: any[] }> {
    const url = email ? `${API_BASE}/auth/dev-mailbox?email=${encodeURIComponent(email)}` : `${API_BASE}/auth/dev-mailbox`;
    const res = await fetch(url, { credentials: 'include' });
    return handleResponse(res);
  },

  async logout(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse<{ status: string; message: string }>(res);
  },

  // Job Descriptions
  async listJobs(): Promise<JobDescription[]> {
    const res = await fetch(`${API_BASE}/jobs`, {
      credentials: 'include',
    });
    return handleResponse<JobDescription[]>(res);
  },

  async createJob(data: Omit<JobDescription, 'id' | 'user_id' | 'created_at'>): Promise<JobDescription> {
    const res = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<JobDescription>(res);
  },

  async deleteJob(jobId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse<{ message: string }>(res);
  },

  async updateJob(jobId: number, data: Partial<JobDescription>): Promise<JobDescription> {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<JobDescription>(res);
  },

  // Resumes
  async listResumes(): Promise<ResumeItem[]> {
    const res = await fetch(`${API_BASE}/resumes`, {
      credentials: 'include',
    });
    return handleResponse<ResumeItem[]>(res);
  },

  async uploadResumes(files: File[]): Promise<ResumeItem[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    const res = await fetch(`${API_BASE}/resumes/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return handleResponse<ResumeItem[]>(res);
  },

  async deleteResume(resumeId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/resumes/${resumeId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse<{ message: string }>(res);
  },

  // Screening
  async analyzeScreening(data: {
    job_id?: number;
    job_title?: string;
    job_description?: string;
    required_skills?: string;
    preferred_skills?: string;
    min_experience_years?: number;
    min_education?: string;
    resume_ids: number[];
  }): Promise<ScreeningResults> {
    const res = await fetch(`${API_BASE}/screening/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ScreeningResults>(res);
  },

  async startScreening(data: { job_id: number; resume_ids: number[] }): Promise<ScreeningResults> {
    const res = await fetch(`${API_BASE}/screening/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return handleResponse<ScreeningResults>(res);
  },

  async getLatestScreening(jobId?: number): Promise<ScreeningResults> {
    const url = jobId ? `${API_BASE}/screening/latest?job_id=${jobId}` : `${API_BASE}/screening/latest`;
    const res = await fetch(url, {
      credentials: 'include',
    });
    return handleResponse<ScreeningResults>(res);
  },

  async deleteScreening(sessionId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/screening/${sessionId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse<{ message: string }>(res);
  },

  // Candidates
  async listCandidates(params?: { status?: string; search?: string; min_score?: number }): Promise<Candidate[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.min_score !== undefined) searchParams.append('min_score', params.min_score.toString());

    const res = await fetch(`${API_BASE}/candidates?${searchParams.toString()}`, {
      credentials: 'include',
    });
    return handleResponse<Candidate[]>(res);
  },

  async getCandidateDetail(candidateId: number): Promise<CandidateDetail> {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
      credentials: 'include',
    });
    return handleResponse<CandidateDetail>(res);
  },

  async getCandidate(candidateId: number): Promise<CandidateDetail> {
    return this.getCandidateDetail(candidateId);
  },

  async updateCandidateStatus(candidateId: number, newStatus: string): Promise<Candidate> {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: newStatus }),
    });
    return handleResponse<Candidate>(res);
  },

  async deleteCandidate(candidateId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return handleResponse<{ message: string }>(res);
  },

  // Reports
  async exportReportPdf(sessionId: number): Promise<Blob> {
    const res = await fetch(`${API_BASE}/reports/${sessionId}/pdf`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('PDF export failed');
    return res.blob();
  },

  async exportReportPDF(sessionId: number): Promise<Blob> {
    return this.exportReportPdf(sessionId);
  },

  async exportReportCsv(sessionId: number): Promise<Blob> {
    const res = await fetch(`${API_BASE}/reports/${sessionId}/csv`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('CSV export failed');
    return res.blob();
  },

  async exportReportCSV(sessionId: number): Promise<Blob> {
    return this.exportReportCsv(sessionId);
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      credentials: 'include',
    });
    return handleResponse<AnalyticsOverview>(res);
  },

  // Settings
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/settings/status`, {
      credentials: 'include',
    });
    return handleResponse<SystemStatus>(res);
  },

  async cleanupResumes(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/settings/cleanup-resumes`, {
      method: 'POST',
      credentials: 'include',
    });
    return handleResponse<{ message: string }>(res);
  },
};
