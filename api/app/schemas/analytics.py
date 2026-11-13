from pydantic import BaseModel
from typing import List, Dict, Any

class ScoreBucket(BaseModel):
    range: str
    count: int

class SkillFrequency(BaseModel):
    skill: str
    count: int

class MonthlyProcessingItem(BaseModel):
    month: str
    count: int
    avg_score: float

class AnalyticsOverviewOut(BaseModel):
    total_resumes: int
    active_jobs: int
    avg_match_score: float
    candidates_pending_review: int
    candidates_shortlisted: int
    candidates_rejected: int
    score_distribution: List[ScoreBucket]
    top_skills_matched: List[SkillFrequency]
    recent_activity: List[Dict[str, Any]]
    screening_performance: List[Dict[str, Any]]
