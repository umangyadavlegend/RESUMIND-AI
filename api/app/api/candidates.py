from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.candidate import Candidate
from app.models.score import CandidateScore
from app.models.resume import Resume
from app.models.user import User
from app.schemas.candidate import CandidateOut, CandidateDetailOut, CandidateStatusUpdate, CandidateScoreOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.get("", response_model=List[CandidateOut])
def list_candidates(
    status: Optional[str] = Query(None, description="Filter by status: pending, shortlisted, review, rejected"),
    search: Optional[str] = Query(None, description="Search by candidate name, email, or skill"),
    min_score: Optional[float] = Query(None, description="Filter by minimum overall score"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all candidate profiles with score metadata and filtering."""
    query = db.query(Candidate).filter(Candidate.user_id == current_user.id)

    if status and status.lower() != "all":
        query = query.filter(Candidate.status == status.lower())
    
    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.filter(
            (Candidate.name.ilike(search_fmt)) |
            (Candidate.email.ilike(search_fmt)) |
            (Candidate.skills.ilike(search_fmt)) |
            (Candidate.current_role.ilike(search_fmt))
        )

    candidates = query.order_by(Candidate.created_at.desc()).all()
    results = []
    for cand in candidates:
        latest_score = db.query(CandidateScore).filter(
            CandidateScore.candidate_id == cand.id
        ).order_by(CandidateScore.created_at.desc()).first()

        if min_score is not None and latest_score:
            if latest_score.overall_score < min_score:
                continue

        cand_out = CandidateOut(
            id=cand.id,
            user_id=cand.user_id,
            resume_id=cand.resume_id,
            name=cand.name,
            email=cand.email,
            phone=cand.phone,
            location=cand.location,
            linkedin_url=cand.linkedin_url,
            github_url=cand.github_url,
            experience_years=cand.experience_years,
            education_level=cand.education_level,
            education_details=cand.education_details,
            current_role=cand.current_role,
            skills=cand.skills,
            summary=cand.summary,
            status=cand.status,
            notes=cand.notes,
            created_at=cand.created_at,
            latest_score=CandidateScoreOut.model_validate(latest_score) if latest_score else None
        )
        results.append(cand_out)

    return results

@router.get("/{id}", response_model=CandidateDetailOut)
def get_candidate(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full candidate drilldown including extracted resume text and score history."""
    cand = db.query(Candidate).filter(
        Candidate.id == id,
        Candidate.user_id == current_user.id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    resume = db.query(Resume).filter(Resume.id == cand.resume_id).first() if cand.resume_id else None
    resume_text = resume.extracted_text if resume else ""

    scores = db.query(CandidateScore).filter(
        CandidateScore.candidate_id == cand.id
    ).order_by(CandidateScore.created_at.desc()).all()

    latest = scores[0] if scores else None

    return CandidateDetailOut(
        id=cand.id,
        user_id=cand.user_id,
        resume_id=cand.resume_id,
        name=cand.name,
        email=cand.email,
        phone=cand.phone,
        location=cand.location,
        linkedin_url=cand.linkedin_url,
        github_url=cand.github_url,
        experience_years=cand.experience_years,
        education_level=cand.education_level,
        education_details=cand.education_details,
        current_role=cand.current_role,
        skills=cand.skills,
        summary=cand.summary,
        status=cand.status,
        notes=cand.notes,
        created_at=cand.created_at,
        latest_score=CandidateScoreOut.model_validate(latest) if latest else None,
        resume_text=resume_text,
        scores=[CandidateScoreOut.model_validate(s) for s in scores]
    )

@router.patch("/{id}/status", response_model=CandidateOut)
def update_candidate_status(
    id: int,
    status_update: CandidateStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Recruiter action: manually update candidate status.
    Options: pending, shortlisted, review, rejected.
    """
    valid_statuses = ["pending", "shortlisted", "review", "rejected"]
    new_status = status_update.status.lower().strip()
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{new_status}'. Must be one of: {', '.join(valid_statuses)}"
        )

    cand = db.query(Candidate).filter(
        Candidate.id == id,
        Candidate.user_id == current_user.id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    cand.status = new_status
    if status_update.notes is not None:
        cand.notes = status_update.notes

    db.commit()
    db.refresh(cand)

    latest_score = db.query(CandidateScore).filter(
        CandidateScore.candidate_id == cand.id
    ).order_by(CandidateScore.created_at.desc()).first()

    return CandidateOut(
        id=cand.id,
        user_id=cand.user_id,
        resume_id=cand.resume_id,
        name=cand.name,
        email=cand.email,
        phone=cand.phone,
        location=cand.location,
        linkedin_url=cand.linkedin_url,
        github_url=cand.github_url,
        experience_years=cand.experience_years,
        education_level=cand.education_level,
        education_details=cand.education_details,
        current_role=cand.current_role,
        skills=cand.skills,
        summary=cand.summary,
        status=cand.status,
        notes=cand.notes,
        created_at=cand.created_at,
        latest_score=CandidateScoreOut.model_validate(latest_score) if latest_score else None
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an individual candidate record and cascade associated scores."""
    cand = db.query(Candidate).filter(
        Candidate.id == id,
        Candidate.user_id == current_user.id
    ).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    db.delete(cand)
    db.commit()
    return None
