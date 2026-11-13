from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class CandidateScore(Base):
    __tablename__ = "candidate_scores"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    screening_id = Column(Integer, ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # 4-Pillar Weighted Model (50% Skills, 30% Experience, 10% Education, 10% Projects)
    overall_score = Column(Float, nullable=False, index=True)
    skills_score = Column(Float, nullable=False)
    experience_score = Column(Float, nullable=False)
    education_score = Column(Float, nullable=False)
    projects_score = Column(Float, nullable=False)

    matched_skills = Column(Text, nullable=True)  # JSON or comma-separated list
    missing_skills = Column(Text, nullable=True)  # JSON or comma-separated list
    explanation = Column(Text, nullable=False)     # Explainable AI reason breakdown
    recommendation = Column(Text, nullable=False)  # Decision support recommendation

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    candidate = relationship("Candidate", back_populates="scores")
    screening = relationship("ScreeningSession", back_populates="scores")
