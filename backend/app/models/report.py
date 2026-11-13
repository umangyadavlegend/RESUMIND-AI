from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class ScreeningReport(Base):
    __tablename__ = "screening_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    screening_id = Column(Integer, ForeignKey("screening_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    total_candidates = Column(Integer, default=0)
    avg_score = Column(Float, default=0.0)
    highest_score = Column(Float, default=0.0)
    summary_json = Column(Text, nullable=True)  # Serialized analytical metrics
    exported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="reports")
    screening = relationship("ScreeningSession", back_populates="reports")
