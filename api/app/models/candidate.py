from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    experience_years = Column(Float, default=0.0)
    education_level = Column(String(255), nullable=True)
    education_details = Column(Text, nullable=True)
    current_role = Column(String(255), nullable=True)
    skills = Column(Text, nullable=True)  # JSON or comma-separated list of extracted skills
    summary = Column(Text, nullable=True)
    status = Column(String(50), default="pending", index=True)  # pending, shortlisted, review, rejected
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="candidates")
    resume = relationship("Resume", back_populates="candidates")
    scores = relationship("CandidateScore", back_populates="candidate", cascade="all, delete-orphan")
