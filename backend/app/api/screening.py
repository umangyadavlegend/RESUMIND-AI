from typing import List, Optional
from datetime import datetime, timezone
import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.job import JobDescription
from app.models.resume import Resume
from app.models.candidate import Candidate
from app.models.screening import ScreeningSession
from app.models.score import CandidateScore
from app.models.report import ScreeningReport
from app.schemas.screening import ScreeningAnalyzeRequest, ScreeningResultsOut, RankedCandidateItem, ScreeningSessionOut
from app.schemas.candidate import CandidateOut, CandidateScoreOut
from app.schemas.job import JobOut
from app.services.nlp_parser import ResumeNLPParser
from app.services.matcher import CandidateMatcher
from app.api.deps import get_current_user

router = APIRouter(prefix="/screening", tags=["Screening"])

@router.get("", response_model=List[ScreeningSessionOut])
def list_screenings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all screening sessions for the current recruiter."""
    sessions = db.query(ScreeningSession).filter(
        ScreeningSession.user_id == current_user.id
    ).order_by(ScreeningSession.created_at.desc()).all()
    return sessions

@router.post("/analyze", response_model=ScreeningResultsOut)
def analyze_resumes(
    req: ScreeningAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes the complete 6-stage AI screening pipeline:
    1. Reading resumes
    2. Extracting structured information
    3. Identifying & normalizing skills
    4. Comparing job requirements
    5. Calculating 4-pillar match scores
    6. Generating ranked candidate leaderboard with explainable AI reasoning
    """
    # 1. Resolve or create Job Description
    job = None
    if req.job_id:
        job = db.query(JobDescription).filter(
            JobDescription.id == req.job_id,
            JobDescription.user_id == current_user.id
        ).first()
    
    if not job:
        title = req.job_title or "Software Engineer Screening"
        desc = req.job_description or "Screening session for technical qualifications and domain experience."
        req_skills = req.required_skills or "Python, React, SQL, Git"
        job = JobDescription(
            user_id=current_user.id,
            title=title,
            department="Engineering",
            location="Remote",
            employment_type="Full-time",
            description=desc,
            required_skills=req_skills,
            preferred_skills=req.preferred_skills or "",
            min_experience_years=req.min_experience_years or 2,
            min_education=req.min_education or "Bachelor's"
        )
        db.add(job)
        db.commit()
        db.refresh(job)

    # 2. Resolve Resumes to analyze
    if req.resume_ids and len(req.resume_ids) > 0:
        resumes = db.query(Resume).filter(
            Resume.id.in_(req.resume_ids),
            Resume.user_id == current_user.id
        ).all()
    else:
        # If no specific IDs provided, take the latest uploaded resumes
        resumes = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).order_by(Resume.created_at.desc()).limit(15).all()

    if not resumes:
        raise HTTPException(
            status_code=400,
            detail="No resumes available to screen. Please upload at least one resume PDF or DOCX."
        )

    # 3. Create Screening Session record
    session_title = f"{job.title} — Screening ({len(resumes)} Candidates)"
    screening = ScreeningSession(
        user_id=current_user.id,
        job_id=job.id,
        title=session_title,
        status="processing",
        total_resumes=len(resumes),
        average_score=0.0
    )
    db.add(screening)
    db.commit()
    db.refresh(screening)

    job_dict = {
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills,
        "preferred_skills": job.preferred_skills,
        "min_experience_years": job.min_experience_years,
        "min_education": job.min_education
    }

    ranked_items = []
    total_score_sum = 0.0

    # 4. Pipeline Execution for each resume
    for resume in resumes:
        raw_text = resume.extracted_text or ""
        # Step 2 & 3: Parse entities & normalize skills
        parsed_data = ResumeNLPParser.parse_resume(raw_text)

        # Upsert or associate candidate
        candidate = db.query(Candidate).filter(
            Candidate.user_id == current_user.id,
            Candidate.resume_id == resume.id
        ).first()

        skills_str = ", ".join(parsed_data["skills"])

        if not candidate:
            candidate = Candidate(
                user_id=current_user.id,
                resume_id=resume.id,
                name=parsed_data["name"],
                email=parsed_data["email"],
                phone=parsed_data["phone"],
                location=parsed_data["location"],
                linkedin_url=parsed_data["linkedin_url"],
                github_url=parsed_data["github_url"],
                experience_years=parsed_data["experience_years"],
                education_level=parsed_data["education_level"],
                education_details=parsed_data["education_details"],
                current_role=parsed_data["current_role"],
                skills=skills_str,
                summary=parsed_data["summary"],
                status="pending"
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)
        else:
            # Update candidate extracted attributes
            candidate.name = parsed_data["name"]
            candidate.email = parsed_data["email"] or candidate.email
            candidate.phone = parsed_data["phone"] or candidate.phone
            candidate.experience_years = parsed_data["experience_years"]
            candidate.skills = skills_str
            candidate.education_level = parsed_data["education_level"]
            candidate.summary = parsed_data["summary"]
            db.commit()
            db.refresh(candidate)

        # Step 4 & 5: Match candidate to job & score
        match_result = CandidateMatcher.match_candidate_to_job(parsed_data, job_dict)

        cand_score = CandidateScore(
            candidate_id=candidate.id,
            screening_id=screening.id,
            overall_score=match_result["overall_score"],
            skills_score=match_result["skills_score"],
            experience_score=match_result["experience_score"],
            education_score=match_result["education_score"],
            projects_score=match_result["projects_score"],
            matched_skills=match_result["matched_skills"],
            missing_skills=match_result["missing_skills"],
            explanation=match_result["explanation"],
            recommendation=match_result["recommendation"]
        )
        db.add(cand_score)
        db.commit()
        db.refresh(cand_score)

        total_score_sum += match_result["overall_score"]

        ranked_items.append({
            "candidate": candidate,
            "score": cand_score
        })

    # Step 6: Rank candidates from highest to lowest score
    ranked_items.sort(key=lambda x: x["score"].overall_score, reverse=True)

    # Assign rank indices
    final_ranked_candidates = []
    for rank_idx, item in enumerate(ranked_items, start=1):
        cand_model = item["candidate"]
        score_model = item["score"]
        
        cand_out = CandidateOut(
            id=cand_model.id,
            user_id=cand_model.user_id,
            resume_id=cand_model.resume_id,
            name=cand_model.name,
            email=cand_model.email,
            phone=cand_model.phone,
            location=cand_model.location,
            linkedin_url=cand_model.linkedin_url,
            github_url=cand_model.github_url,
            experience_years=cand_model.experience_years,
            education_level=cand_model.education_level,
            education_details=cand_model.education_details,
            current_role=cand_model.current_role,
            skills=cand_model.skills,
            summary=cand_model.summary,
            status=cand_model.status,
            notes=cand_model.notes,
            created_at=cand_model.created_at,
            latest_score=CandidateScoreOut.model_validate(score_model)
        )
        
        final_ranked_candidates.append(RankedCandidateItem(
            candidate=cand_out,
            score=CandidateScoreOut.model_validate(score_model),
            rank=rank_idx
        ))

    # Update screening session metrics
    avg_score = round(total_score_sum / len(resumes), 1) if resumes else 0.0
    screening.average_score = avg_score
    screening.status = "completed"
    screening.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(screening)

    # Create Screening Report record
    highest_score = ranked_items[0]["score"].overall_score if ranked_items else 0.0
    report = ScreeningReport(
        user_id=current_user.id,
        screening_id=screening.id,
        title=f"Report: {screening.title}",
        total_candidates=len(resumes),
        avg_score=avg_score,
        highest_score=highest_score,
        summary_json=json.dumps({
            "job_title": job.title,
            "required_skills": job.required_skills,
            "min_experience_years": job.min_experience_years,
            "top_candidate": ranked_items[0]["candidate"].name if ranked_items else "N/A"
        })
    )
    db.add(report)
    db.commit()

    return ScreeningResultsOut(
        session=ScreeningSessionOut(
            id=screening.id,
            user_id=screening.user_id,
            job_id=screening.job_id,
            title=screening.title,
            status=screening.status,
            total_resumes=screening.total_resumes,
            average_score=screening.average_score,
            created_at=screening.created_at,
            completed_at=screening.completed_at,
            job=JobOut.model_validate(job)
        ),
        candidates=final_ranked_candidates
    )

@router.post("/start", response_model=ScreeningResultsOut)
def start_screening_alias(
    req: ScreeningAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Direct alias endpoint for /analyze to start screening pipeline."""
    return analyze_resumes(req=req, db=db, current_user=current_user)

@router.get("/latest", response_model=ScreeningResultsOut)
def get_latest_screening(
    job_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the most recent screening results for the user."""
    query = db.query(ScreeningSession).filter(ScreeningSession.user_id == current_user.id)
    if job_id:
        query = query.filter(ScreeningSession.job_id == job_id)
    session = query.order_by(ScreeningSession.created_at.desc()).first()
    if not session:
        raise HTTPException(status_code=404, detail="No screening sessions found.")
    return get_screening_results(id=session.id, db=db, current_user=current_user)

@router.get("/{id}", response_model=ScreeningSessionOut)
def get_screening(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details of a specific screening session."""
    session = db.query(ScreeningSession).filter(
        ScreeningSession.id == id,
        ScreeningSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Screening session not found.")
    return session

@router.get("/{id}/results", response_model=ScreeningResultsOut)
def get_screening_results(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve ranked candidate leaderboard for a completed screening session."""
    session = db.query(ScreeningSession).filter(
        ScreeningSession.id == id,
        ScreeningSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Screening session not found.")

    scores = db.query(CandidateScore).filter(
        CandidateScore.screening_id == session.id
    ).order_by(CandidateScore.overall_score.desc()).all()

    ranked_items = []
    for rank_idx, score in enumerate(scores, start=1):
        cand = db.query(Candidate).filter(Candidate.id == score.candidate_id).first()
        if cand:
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
                latest_score=CandidateScoreOut.model_validate(score)
            )
            ranked_items.append(RankedCandidateItem(
                candidate=cand_out,
                score=CandidateScoreOut.model_validate(score),
                rank=rank_idx
            ))

    job = db.query(JobDescription).filter(JobDescription.id == session.job_id).first()
    job_out = JobOut.model_validate(job) if job else None

    return ScreeningResultsOut(
        session=ScreeningSessionOut(
            id=session.id,
            user_id=session.user_id,
            job_id=session.job_id,
            title=session.title,
            status=session.status,
            total_resumes=session.total_resumes,
            average_score=session.average_score,
            created_at=session.created_at,
            completed_at=session.completed_at,
            job=job_out
        ),
        candidates=ranked_items
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_screening(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a screening session and all its associated scores and reports."""
    session = db.query(ScreeningSession).filter(
        ScreeningSession.id == id,
        ScreeningSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Screening session not found.")
    
    db.delete(session)
    db.commit()
    return None
