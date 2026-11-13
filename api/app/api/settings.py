import os
from typing import Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.resume import Resume
from app.models.candidate import Candidate
from app.models.score import CandidateScore
from app.models.screening import ScreeningSession
from app.models.report import ScreeningReport
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/status")
def get_system_status(current_user: User = Depends(get_current_user)):
    """Check system operational status and AI engine mode."""
    llm_status = "Autonomous Heuristic NLP Engine (Offline & Bias-Free)"
    if settings.OPENAI_API_KEY:
        llm_status = "OpenAI GPT-4o Enhanced Mode"
    elif settings.ANTHROPIC_API_KEY:
        llm_status = "Claude 3.5 Sonnet Enhanced Mode"
    elif settings.GEMINI_API_KEY:
        llm_status = "Gemini 1.5 Pro Enhanced Mode"

    return {
        "status": "operational",
        "app_name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "SQLite / PostgreSQL Compatible",
        "nlp_engine": llm_status,
        "scoring_model": "4-Pillar Explainable Weight (Skills 50%, Experience 30%, Education 10%, Projects 10%)",
        "data_retention_policy": "Full recruiter control with immediate deletion on request",
        "user_email": current_user.email,
        "user_name": current_user.full_name,
        "company": current_user.company_name
    }

@router.post("/cleanup-resumes", status_code=status.HTTP_200_OK)
def cleanup_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Privacy & Data Retention: Delete all uploaded resumes, candidates,
    and associated files belonging to the current user.
    """
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    count = len(resumes)

    # Delete files on disk
    for r in resumes:
        if os.path.exists(r.file_path):
            try:
                os.remove(r.file_path)
            except OSError:
                pass

    # Delete records in safe dependency cascade order
    user_cand_ids = [c.id for c in db.query(Candidate.id).filter(Candidate.user_id == current_user.id).all()]
    if user_cand_ids:
        db.query(CandidateScore).filter(CandidateScore.candidate_id.in_(user_cand_ids)).delete(synchronize_session=False)

    db.query(ScreeningReport).filter(ScreeningReport.user_id == current_user.id).delete(synchronize_session=False)
    db.query(ScreeningSession).filter(ScreeningSession.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Candidate).filter(Candidate.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Resume).filter(Resume.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()

    return {"message": f"Successfully deleted {count} resumes and associated candidate data in compliance with data privacy policies."}
