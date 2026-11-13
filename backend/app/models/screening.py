from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class ScreeningSession(Base):
    __tablename__ = "screening_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default="processing")  # processing, completed, failed
    total_resumes = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="screening_sessions")
    job = relationship("JobDescription", back_populates="screening_sessions")
    scores = relationship("CandidateScore", back_populates="screening", cascade="all, delete-orphan")
    reports = relationship("ScreeningReport", back_populates="screening", cascade="all, delete-orphan")
