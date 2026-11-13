from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.job import JobDescription
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["Job Descriptions"])

@router.get("", response_model=List[JobOut])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all job descriptions owned by the user."""
    return db.query(JobDescription).filter(JobDescription.user_id == current_user.id).order_by(JobDescription.created_at.desc()).all()

@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new job description."""
    job = JobDescription(
        user_id=current_user.id,
        title=job_in.title.strip(),
        department=job_in.department,
        location=job_in.location,
        employment_type=job_in.employment_type,
        description=job_in.description.strip(),
        required_skills=job_in.required_skills.strip(),
        preferred_skills=job_in.preferred_skills.strip() if job_in.preferred_skills else "",
        min_experience_years=job_in.min_experience_years or 2,
        min_education=job_in.min_education or "Bachelor's"
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

@router.get("/{id}", response_model=JobOut)
def get_job(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve details for a specific job description."""
    job = db.query(JobDescription).filter(
        JobDescription.id == id,
        JobDescription.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")
    return job

@router.patch("/{id}", response_model=JobOut)
@router.put("/{id}", response_model=JobOut)
def update_job(
    id: int,
    job_in: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing job description."""
    job = db.query(JobDescription).filter(
        JobDescription.id == id,
        JobDescription.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")

    if job_in.title is not None:
        job.title = job_in.title.strip()
    if job_in.department is not None:
        job.department = job_in.department
    if job_in.location is not None:
        job.location = job_in.location
    if job_in.employment_type is not None:
        job.employment_type = job_in.employment_type
    if job_in.description is not None:
        job.description = job_in.description.strip()
    if job_in.required_skills is not None:
        job.required_skills = job_in.required_skills.strip()
    if job_in.preferred_skills is not None:
        job.preferred_skills = job_in.preferred_skills.strip()
    if job_in.min_experience_years is not None:
        job.min_experience_years = job_in.min_experience_years
    if job_in.min_education is not None:
        job.min_education = job_in.min_education

    db.commit()
    db.refresh(job)
    return job

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a job description and cascade related screenings."""
    job = db.query(JobDescription).filter(
        JobDescription.id == id,
        JobDescription.user_id == current_user.id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found.")
    
    db.delete(job)
    db.commit()
    return None
