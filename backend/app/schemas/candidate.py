from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CandidateBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    experience_years: Optional[float] = 0.0
    education_level: Optional[str] = None
    education_details: Optional[str] = None
    current_role: Optional[str] = None
    skills: Optional[str] = None
    summary: Optional[str] = None
    status: Optional[str] = "pending"
    notes: Optional[str] = None

class CandidateStatusUpdate(BaseModel):
    status: str  # pending, shortlisted, review, rejected
    notes: Optional[str] = None

class CandidateScoreOut(BaseModel):
    id: int
    candidate_id: int
    screening_id: int
    overall_score: float
    skills_score: float
    experience_score: float
    education_score: float
    projects_score: float
    matched_skills: Optional[str] = None
    missing_skills: Optional[str] = None
    explanation: str
    recommendation: str
    created_at: datetime

    class Config:
        from_attributes = True

class CandidateOut(CandidateBase):
    id: int
    user_id: int
    resume_id: Optional[int] = None
    created_at: datetime
    latest_score: Optional[CandidateScoreOut] = None

    class Config:
        from_attributes = True

class CandidateDetailOut(CandidateOut):
    resume_text: Optional[str] = None
    scores: List[CandidateScoreOut] = []
