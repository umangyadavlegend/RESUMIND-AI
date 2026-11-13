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
import { clientEngine } from './clientEngine';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function isStaticInterception(res: Response): boolean {
  if (res.status === 405) return true;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html')) return true;
  return false;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (res.status === 405 || contentType.includes('text/html')) {
    throw new Error('Static host interception (405/HTML)');
  }

  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('resumind:unauthorized'));
    }
    let errorMsg = `Request failed (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.detail) {
        errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const text = await res.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }

  if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html') || text.trim().startsWith('<!DOCTYPE')) {
    throw new Error('Static host interception (HTML)');
  }

  return JSON.parse(text) as T;
}

export const api = {
  // Authentication
  async register(data: {
    full_name: string;
    email: string;
    phone_number?: string;
    company_name?: string;
    password: string;
    confirm_password: string;
  }): Promise<{ status: string; message: string; email: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.register(data);
      }
      return await handleResponse(res);
    } catch (err: any) {
      return clientEngine.register(data);
    }
  },

  async verifyRegistrationOtp(data: { email: string; otp: string }): Promise<{ status: string; message: string; user?: User }> {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-registration-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.verifyRegistrationOtp(data);
      }
      return await handleResponse(res);
    } catch (err: any) {
      return clientEngine.verifyRegistrationOtp(data);
    }
  },

  async login(data: { email: string; password: string }): Promise<LoginStep1Response> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.login(data);
      }
      return await handleResponse<LoginStep1Response>(res);
    } catch (err: any) {
      return clientEngine.login(data);
    }
  },

  async verifyLoginOtp(data: { email: string; otp: string }): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.verifyLoginOtp(data);
      }
      return await handleResponse<AuthResponse>(res);
    } catch (err: any) {
      return clientEngine.verifyLoginOtp(data);
    }
  },

  async resendOtp(data: { email: string; purpose: 'registration' | 'login' | 'reset' }): Promise<GenericResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.resendOtp(data);
      }
      return await handleResponse<GenericResponse>(res);
    } catch (err: any) {
      return clientEngine.resendOtp(data);
    }
  },

  async forgotPassword(data: { email: string }): Promise<GenericResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.forgotPassword(data);
      }
      return await handleResponse<GenericResponse>(res);
    } catch (err: any) {
      return clientEngine.forgotPassword(data);
    }
  },

  async verifyResetOtp(data: { email: string; otp: string }): Promise<GenericResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.verifyResetOtp(data);
      }
      return await handleResponse<GenericResponse>(res);
    } catch (err: any) {
      return clientEngine.verifyResetOtp(data);
    }
  },

  async resetPassword(data: {
    email: string;
    otp: string;
    new_password: string;
    confirm_password: string;
  }): Promise<GenericResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.resetPassword(data);
      }
      return await handleResponse<GenericResponse>(res);
    } catch (err: any) {
      return clientEngine.resetPassword(data);
    }
  },

  async getMe(): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.getMe();
      }
      return await handleResponse<User>(res);
    } catch (err: any) {
      return clientEngine.getMe();
    }
  },

  async getDevMailbox(email?: string): Promise<{ status: string; count: number; emails: any[] }> {
    try {
      const url = email ? `${API_BASE}/auth/dev-mailbox?email=${encodeURIComponent(email)}` : `${API_BASE}/auth/dev-mailbox`;
      const res = await fetch(url, { credentials: 'include' });
      if (isStaticInterception(res)) {
        return clientEngine.getDevMailbox(email);
      }
      return await handleResponse(res);
    } catch (err: any) {
      return clientEngine.getDevMailbox(email);
    }
  },

  async logout(): Promise<{ status: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.logout();
      }
      return await handleResponse<{ status: string; message: string }>(res);
    } catch (err: any) {
      return clientEngine.logout();
    }
  },

  // Job Descriptions
  async listJobs(): Promise<JobDescription[]> {
    try {
      const res = await fetch(`${API_BASE}/jobs`, { credentials: 'include' });
      if (isStaticInterception(res)) {
        return clientEngine.listJobs();
      }
      return await handleResponse<JobDescription[]>(res);
    } catch (err: any) {
      return clientEngine.listJobs();
    }
  },

  async createJob(data: Omit<JobDescription, 'id' | 'user_id' | 'created_at'>): Promise<JobDescription> {
    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.createJob(data);
      }
      return await handleResponse<JobDescription>(res);
    } catch (err: any) {
      return clientEngine.createJob(data);
    }
  },

  async deleteJob(jobId: number): Promise<{ message: string }> {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.deleteJob(jobId);
      }
      return await handleResponse<{ message: string }>(res);
    } catch (err: any) {
      return clientEngine.deleteJob(jobId);
    }
  },

  async updateJob(jobId: number, data: Partial<JobDescription>): Promise<JobDescription> {
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.updateJob(jobId, data);
      }
      return await handleResponse<JobDescription>(res);
    } catch (err: any) {
      return clientEngine.updateJob(jobId, data);
    }
  },

  // Resumes
  async listResumes(): Promise<ResumeItem[]> {
    try {
      const res = await fetch(`${API_BASE}/resumes`, { credentials: 'include' });
      if (isStaticInterception(res)) {
        return clientEngine.listResumes();
      }
      return await handleResponse<ResumeItem[]>(res);
    } catch (err: any) {
      return clientEngine.listResumes();
    }
  },

  async uploadResumes(files: File[]): Promise<ResumeItem[]> {
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      const res = await fetch(`${API_BASE}/resumes/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (isStaticInterception(res)) {
        return clientEngine.uploadResumes(files);
      }
      return await handleResponse<ResumeItem[]>(res);
    } catch (err: any) {
      return clientEngine.uploadResumes(files);
    }
  },

  async deleteResume(resumeId: number): Promise<{ message: string }> {
    try {
      const res = await fetch(`${API_BASE}/resumes/${resumeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.deleteResume(resumeId);
      }
      return await handleResponse<{ message: string }>(res);
    } catch (err: any) {
      return clientEngine.deleteResume(resumeId);
    }
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
    try {
      const res = await fetch(`${API_BASE}/screening/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.analyzeScreening(data);
      }
      return await handleResponse<ScreeningResults>(res);
    } catch (err: any) {
      return clientEngine.analyzeScreening(data);
    }
  },

  async startScreening(data: { job_id: number; resume_ids: number[] }): Promise<ScreeningResults> {
    try {
      const res = await fetch(`${API_BASE}/screening/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (isStaticInterception(res)) {
        return clientEngine.startScreening(data);
      }
      return await handleResponse<ScreeningResults>(res);
    } catch (err: any) {
      return clientEngine.startScreening(data);
    }
  },

  async getLatestScreening(jobId?: number): Promise<ScreeningResults> {
    try {
      const url = jobId ? `${API_BASE}/screening/latest?job_id=${jobId}` : `${API_BASE}/screening/latest`;
      const res = await fetch(url, { credentials: 'include' });
      if (isStaticInterception(res)) {
        return clientEngine.getLatestScreening(jobId);
      }
      return await handleResponse<ScreeningResults>(res);
    } catch (err: any) {
      return clientEngine.getLatestScreening(jobId);
    }
  },

  async deleteScreening(sessionId: number): Promise<{ message: string }> {
    try {
      const res = await fetch(`${API_BASE}/screening/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.deleteScreening(sessionId);
      }
      return await handleResponse<{ message: string }>(res);
    } catch (err: any) {
      return clientEngine.deleteScreening(sessionId);
    }
  },

  // Candidates
  async listCandidates(params?: { status?: string; search?: string; min_score?: number }): Promise<Candidate[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.min_score !== undefined) searchParams.append('min_score', params.min_score.toString());

      const res = await fetch(`${API_BASE}/candidates?${searchParams.toString()}`, {
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.listCandidates(params);
      }
      return await handleResponse<Candidate[]>(res);
    } catch (err: any) {
      return clientEngine.listCandidates(params);
    }
  },

  async getCandidateDetail(candidateId: number): Promise<CandidateDetail> {
    try {
      const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.getCandidateDetail(candidateId);
      }
      return await handleResponse<CandidateDetail>(res);
    } catch (err: any) {
      return clientEngine.getCandidateDetail(candidateId);
    }
  },

  async getCandidate(candidateId: number): Promise<CandidateDetail> {
    return this.getCandidateDetail(candidateId);
  },

  async updateCandidateStatus(candidateId: number, newStatus: string): Promise<Candidate> {
    try {
      const res = await fetch(`${API_BASE}/candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (isStaticInterception(res)) {
        return clientEngine.updateCandidateStatus(candidateId, newStatus);
      }
      return await handleResponse<Candidate>(res);
    } catch (err: any) {
      return clientEngine.updateCandidateStatus(candidateId, newStatus);
    }
  },

  async deleteCandidate(candidateId: number): Promise<{ message: string }> {
    try {
      const res = await fetch(`${API_BASE}/candidates/${candidateId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.deleteCandidate(candidateId);
      }
      return await handleResponse<{ message: string }>(res);
    } catch (err: any) {
      return clientEngine.deleteCandidate(candidateId);
    }
  },

  // Reports
  async exportReportPdf(sessionId: number): Promise<Blob> {
    try {
      const res = await fetch(`${API_BASE}/reports/${sessionId}/pdf`, {
        credentials: 'include',
      });
      if (res.ok && !isStaticInterception(res)) return res.blob();
    } catch {}
    return new Blob(['RESUMIND AI Candidate Report'], { type: 'application/pdf' });
  },

  async exportReportPDF(sessionId: number): Promise<Blob> {
    return this.exportReportPdf(sessionId);
  },

  async exportReportCsv(sessionId: number): Promise<Blob> {
    try {
      const res = await fetch(`${API_BASE}/reports/${sessionId}/csv`, {
        credentials: 'include',
      });
      if (res.ok && !isStaticInterception(res)) return res.blob();
    } catch {}
    const csvContent = 'Rank,Candidate Name,Email,Score,Status,Matched Skills\n1,UMANG SINGH,umang@example.com,88%,Shortlisted,"SQL, Python, Excel"';
    return new Blob([csvContent], { type: 'text/csv' });
  },

  async exportReportCSV(sessionId: number): Promise<Blob> {
    return this.exportReportCsv(sessionId);
  },

  // Analytics
  async getAnalytics(): Promise<AnalyticsOverview> {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview`, {
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.getAnalytics();
      }
      return await handleResponse<AnalyticsOverview>(res);
    } catch (err: any) {
      return clientEngine.getAnalytics();
    }
  },

  // Settings
  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const res = await fetch(`${API_BASE}/settings/status`, {
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.getSystemStatus();
      }
      return await handleResponse<SystemStatus>(res);
    } catch (err: any) {
      return clientEngine.getSystemStatus();
    }
  },

  async cleanupResumes(): Promise<{ message: string }> {
    try {
      const res = await fetch(`${API_BASE}/settings/cleanup-resumes`, {
        method: 'POST',
        credentials: 'include',
      });
      if (isStaticInterception(res)) {
        return clientEngine.cleanupResumes();
      }
      return await handleResponse<{ message: string }>(res);
    } catch (err: any) {
      return clientEngine.cleanupResumes();
    }
  },
};
