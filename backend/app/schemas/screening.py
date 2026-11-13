from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.candidate import CandidateOut, CandidateScoreOut
from app.schemas.job import JobOut

class ScreeningAnalyzeRequest(BaseModel):
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    required_skills: Optional[str] = None
    preferred_skills: Optional[str] = None
    min_experience_years: Optional[int] = 2
    min_education: Optional[str] = "Bachelor's"
    resume_ids: Optional[List[int]] = None  # Existing resume IDs to screen

class RankedCandidateItem(BaseModel):
    candidate: CandidateOut
    score: CandidateScoreOut
    rank: int

class ScreeningSessionOut(BaseModel):
    id: int
    user_id: int
    job_id: int
    title: str
    status: str
    total_resumes: int
    average_score: float
    created_at: datetime
    completed_at: Optional[datetime] = None
    job: Optional[JobOut] = None

    class Config:
        from_attributes = True

class ScreeningResultsOut(BaseModel):
    session: ScreeningSessionOut
    candidates: List[RankedCandidateItem]
