from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(100), nullable=True, default="Engineering")
    location = Column(String(100), nullable=True, default="Remote")
    employment_type = Column(String(50), nullable=True, default="Full-time")
    description = Column(Text, nullable=False)
    required_skills = Column(Text, nullable=False)  # Comma-separated or JSON list
    preferred_skills = Column(Text, nullable=True, default="")
    min_experience_years = Column(Integer, default=2)
    min_education = Column(String(100), default="Bachelor's")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="jobs")
    screening_sessions = relationship("ScreeningSession", back_populates="job", cascade="all, delete-orphan")
