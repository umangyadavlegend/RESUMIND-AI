from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ResumeOut(BaseModel):
    id: int
    user_id: int
    original_filename: str
    file_size: int
    file_type: str
    created_at: datetime
    extracted_text_preview: Optional[str] = None

    class Config:
        from_attributes = True
