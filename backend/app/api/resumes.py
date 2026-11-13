import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeOut
from app.services.extractor import DocumentExtractor, DocumentExtractionError
from app.api.deps import get_current_user

router = APIRouter(prefix="/resumes", tags=["Resumes"])

@router.get("", response_model=List[ResumeOut])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all uploaded resumes owned by the user."""
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    # Add extracted text preview
    result = []
    for r in resumes:
        preview = (r.extracted_text[:200] + "...") if r.extracted_text else ""
        result.append(ResumeOut(
            id=r.id,
            user_id=r.user_id,
            original_filename=r.original_filename,
            file_size=r.file_size,
            file_type=r.file_type,
            created_at=r.created_at,
            extracted_text_preview=preview
        ))
    return result

@router.post("/upload", response_model=List[ResumeOut], status_code=status.HTTP_201_CREATED)
async def upload_resumes(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload one or multiple resumes (.pdf or .docx).
    Validates file sizes, mime types, extracts text, and stores securely.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")

    uploaded_resumes = []
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    for file in files:
        filename = file.filename or "unknown.pdf"
        ext = os.path.splitext(filename)[1].lower()
        
        # File type validation
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type '{ext}' for file '{filename}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

        content = await file.read()
        file_size = len(content)

        # File size validation
        if file_size == 0:
            raise HTTPException(
                status_code=400,
                detail=f"File '{filename}' is empty."
            )
        if file_size > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File '{filename}' exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
            )

        # Extract text
        try:
            extracted_text = DocumentExtractor.extract_text(content, filename)
        except DocumentExtractionError as e:
            raise HTTPException(
                status_code=422,
                detail=f"Could not extract text from '{filename}': {str(e)}"
            )

        # Store to disk with sanitized unique name
        stored_name = f"{uuid.uuid4().hex}_{filename}"
        disk_path = os.path.join(settings.UPLOAD_DIR, stored_name)
        with open(disk_path, "wb") as f:
            f.write(content)

        resume = Resume(
            user_id=current_user.id,
            original_filename=filename,
            stored_filename=stored_name,
            file_path=disk_path,
            file_size=file_size,
            file_type=ext.replace(".", ""),
            extracted_text=extracted_text
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)

        preview = (extracted_text[:200] + "...") if extracted_text else ""
        uploaded_resumes.append(ResumeOut(
            id=resume.id,
            user_id=resume.user_id,
            original_filename=resume.original_filename,
            file_size=resume.file_size,
            file_type=resume.file_type,
            created_at=resume.created_at,
            extracted_text_preview=preview
        ))

    return uploaded_resumes

@router.get("/{id}")
def get_resume(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full resume record including extracted text."""
    resume = db.query(Resume).filter(
        Resume.id == id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return resume

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a resume and remove stored file from disk."""
    resume = db.query(Resume).filter(
        Resume.id == id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    # Remove file from disk if present
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except OSError:
            pass

    db.delete(resume)
    db.commit()
    return None
