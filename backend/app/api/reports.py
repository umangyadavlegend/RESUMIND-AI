from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.report import ScreeningReport
from app.models.screening import ScreeningSession
from app.models.candidate import Candidate
from app.models.score import CandidateScore
from app.models.job import JobDescription
from app.models.user import User
from app.services.report_generator import ReportGenerator
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{id}")
def get_report(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve metadata and analytical breakdown for a screening report."""
    report = db.query(ScreeningReport).filter(
        ScreeningReport.id == id,
        ScreeningReport.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Screening report not found.")
    return report

@router.get("/{id}/export")
def export_report(
    id: int,
    format: str = Query("csv", description="Export format: csv or json"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export screening candidate rankings as a CSV or JSON file."""
    # Find report or screening session
    session = None
    if id > 0:
        report = db.query(ScreeningReport).filter(
            ScreeningReport.id == id,
            ScreeningReport.user_id == current_user.id
        ).first()
        screening_id = report.screening_id if report else id
        session = db.query(ScreeningSession).filter(
            ScreeningSession.id == screening_id,
            ScreeningSession.user_id == current_user.id
        ).first()

    # Fallback to the latest screening session if not found or id <= 0
    if not session:
        session = db.query(ScreeningSession).filter(
            ScreeningSession.user_id == current_user.id
        ).order_by(ScreeningSession.created_at.desc()).first()

    if not session:
        # If no screening session exists, export all user candidates directly
        user_cands = db.query(Candidate).filter(Candidate.user_id == current_user.id).order_by(Candidate.created_at.desc()).all()
        if not user_cands:
            raise HTTPException(status_code=404, detail="No candidates or screening data available to export.")
        
        ranked_items = []
        for rank_idx, cand in enumerate(user_cands, start=1):
            latest_s = db.query(CandidateScore).filter(CandidateScore.candidate_id == cand.id).order_by(CandidateScore.created_at.desc()).first()
            ranked_items.append({
                "rank": rank_idx,
                "candidate": {
                    "name": cand.name,
                    "email": cand.email,
                    "phone": cand.phone,
                    "experience_years": cand.experience_years,
                    "education_level": cand.education_level,
                    "status": cand.status
                },
                "score": {
                    "overall_score": latest_s.overall_score if latest_s else 0.0,
                    "skills_score": latest_s.skills_score if latest_s else 0.0,
                    "experience_score": latest_s.experience_score if latest_s else 0.0,
                    "education_score": latest_s.education_score if latest_s else 0.0,
                    "projects_score": latest_s.projects_score if latest_s else 0.0,
                    "matched_skills": latest_s.matched_skills if latest_s else "",
                    "missing_skills": latest_s.missing_skills if latest_s else "",
                    "recommendation": latest_s.recommendation if latest_s else "Pending full screening"
                }
            })
        csv_content = ReportGenerator.generate_csv(ranked_items, "General Candidate Roster")
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="RESUMIND_Candidates_Export.csv"'}
        )

    job = db.query(JobDescription).filter(JobDescription.id == session.job_id).first()
    job_title = job.title if job else "Recruitment Screening"

    scores = db.query(CandidateScore).filter(
        CandidateScore.screening_id == session.id
    ).order_by(CandidateScore.overall_score.desc()).all()

    ranked_items = []
    for rank_idx, score in enumerate(scores, start=1):
        cand = db.query(Candidate).filter(Candidate.id == score.candidate_id).first()
        if cand:
            ranked_items.append({
                "rank": rank_idx,
                "candidate": {
                    "name": cand.name,
                    "email": cand.email,
                    "phone": cand.phone,
                    "experience_years": cand.experience_years,
                    "education_level": cand.education_level,
                    "status": cand.status
                },
                "score": {
                    "overall_score": score.overall_score,
                    "skills_score": score.skills_score,
                    "experience_score": score.experience_score,
                    "education_score": score.education_score,
                    "projects_score": score.projects_score,
                    "matched_skills": score.matched_skills,
                    "missing_skills": score.missing_skills,
                    "recommendation": score.recommendation
                }
            })

    if format.lower() == "csv":
        csv_content = ReportGenerator.generate_csv(ranked_items, job_title)
        filename = f"RESUMIND_Screening_Report_{session.id}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    else:
        return {
            "session_id": session.id,
            "job_title": job_title,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "total_candidates": len(ranked_items),
            "average_score": session.average_score,
            "candidates": ranked_items
        }
