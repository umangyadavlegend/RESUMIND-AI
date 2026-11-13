from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class JobBase(BaseModel):
    title: str
    department: Optional[str] = "Engineering"
    location: Optional[str] = "Remote"
    employment_type: Optional[str] = "Full-time"
    description: str
    required_skills: str
    preferred_skills: Optional[str] = ""
    min_experience_years: Optional[int] = 2
    min_education: Optional[str] = "Bachelor's"

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    preferred_skills: Optional[str] = None
    min_experience_years: Optional[int] = None
    min_education: Optional[str] = None

class JobOut(JobBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
