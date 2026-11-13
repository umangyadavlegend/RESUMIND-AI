from typing import List, Dict, Any
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.resume import Resume
from app.models.job import JobDescription
from app.models.candidate import Candidate
from app.models.score import CandidateScore
from app.models.screening import ScreeningSession
from app.models.user import User
from app.schemas.analytics import AnalyticsOverviewOut, ScoreBucket, SkillFrequency
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewOut)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculate aggregated recruitment performance analytics from real database records."""
    total_resumes = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    active_jobs = db.query(JobDescription).filter(JobDescription.user_id == current_user.id).count()
    
    # Candidates by status
    candidates_pending_review = db.query(Candidate).filter(
        Candidate.user_id == current_user.id,
        Candidate.status.in_(["pending", "review"])
    ).count()

    candidates_shortlisted = db.query(Candidate).filter(
        Candidate.user_id == current_user.id,
        Candidate.status == "shortlisted"
    ).count()

    candidates_rejected = db.query(Candidate).filter(
        Candidate.user_id == current_user.id,
        Candidate.status == "rejected"
    ).count()

    # Scores
    scores = db.query(CandidateScore.overall_score).join(Candidate).filter(
        Candidate.user_id == current_user.id
    ).all()
    score_vals = [s[0] for s in scores if s[0] is not None]

    avg_match_score = round(sum(score_vals) / len(score_vals), 1) if score_vals else 0.0

    # Score distribution buckets
    b_90_100 = sum(1 for s in score_vals if s >= 90)
    b_80_89 = sum(1 for s in score_vals if 80 <= s < 90)
    b_70_79 = sum(1 for s in score_vals if 70 <= s < 80)
    b_60_69 = sum(1 for s in score_vals if 60 <= s < 70)
    b_below_60 = sum(1 for s in score_vals if s < 60)

    score_distribution = [
        ScoreBucket(range="90-100% (Exceptional)", count=b_90_100),
        ScoreBucket(range="80-89% (Strong)", count=b_80_89),
        ScoreBucket(range="70-79% (Moderate)", count=b_70_79),
        ScoreBucket(range="60-69% (Fair)", count=b_60_69),
        ScoreBucket(range="<60% (Low)", count=b_below_60),
    ]

    # Top skills matched
    skill_counter = Counter()
    matched_skill_records = db.query(CandidateScore.matched_skills).join(Candidate).filter(
        Candidate.user_id == current_user.id
    ).all()
    
    for row in matched_skill_records:
        if row[0]:
            skills = [s.strip() for s in row[0].split(',') if s.strip()]
            skill_counter.update(skills)

    top_skills_list = [
        SkillFrequency(skill=k, count=v)
        for k, v in skill_counter.most_common(8)
    ]

    # Recent screening activity
    recent_screenings = db.query(ScreeningSession).filter(
        ScreeningSession.user_id == current_user.id
    ).order_by(ScreeningSession.created_at.desc()).limit(5).all()

    recent_activity = []
    for sc in recent_screenings:
        recent_activity.append({
            "id": sc.id,
            "title": sc.title,
            "candidates_count": sc.total_resumes,
            "avg_score": sc.average_score,
            "status": sc.status,
            "date": sc.created_at.strftime("%b %d, %Y") if sc.created_at else "Recently"
        })

    # Job performance breakdown
    job_screenings = db.query(
        JobDescription.title,
        func.count(ScreeningSession.id),
        func.avg(ScreeningSession.average_score)
    ).join(ScreeningSession, JobDescription.id == ScreeningSession.job_id, isouter=True).filter(
        JobDescription.user_id == current_user.id
    ).group_by(JobDescription.title).limit(6).all()

    screening_performance = []
    for title, count, avg in job_screenings:
        screening_performance.append({
            "job_title": title,
            "screenings_count": count or 0,
            "average_score": round(avg or 0.0, 1)
        })

    return AnalyticsOverviewOut(
        total_resumes=total_resumes,
        active_jobs=active_jobs,
        avg_match_score=avg_match_score,
        candidates_pending_review=candidates_pending_review,
        candidates_shortlisted=candidates_shortlisted,
        candidates_rejected=candidates_rejected,
        score_distribution=score_distribution,
        top_skills_matched=top_skills_list,
        recent_activity=recent_activity,
        screening_performance=screening_performance
    )
