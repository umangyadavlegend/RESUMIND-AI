import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from app.core.config import settings
from app.core.database import Base, engine
from app.api import auth, jobs, resumes, screening, candidates, reports, analytics, settings as settings_api

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Auto-migrate SQLite columns if table already exists
if settings.DATABASE_URL.startswith("sqlite"):
    try:
        import sqlite3
        db_file = settings.DATABASE_URL.replace("sqlite:///", "").replace("sqlite:////", "").replace("sqlite://", "")
        if os.path.exists(db_file):
            con = sqlite3.connect(db_file)
            cur = con.cursor()
            cols = [c[1] for c in cur.execute("PRAGMA table_info(users)").fetchall()]
            if "phone_number" not in cols:
                cur.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR(50)")
            if "is_verified" not in cols:
                cur.execute("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 0")
            if "verification_code" not in cols:
                cur.execute("ALTER TABLE users ADD COLUMN verification_code VARCHAR(50)")
            if "verification_code_expires_at" not in cols:
                cur.execute("ALTER TABLE users ADD COLUMN verification_code_expires_at DATETIME")
            con.commit()
            con.close()
    except Exception:
        pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("resumind_ai")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RESUMIND AI — Intelligent, Explainable AI Resume Screening & Candidate Ranking Platform",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred during processing. Please try again or contact support."}
    )

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(jobs.router, prefix=settings.API_V1_STR)
app.include_router(resumes.router, prefix=settings.API_V1_STR)
app.include_router(screening.router, prefix=settings.API_V1_STR)
app.include_router(candidates.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(settings_api.router, prefix=settings.API_V1_STR)

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint for container probes and monitoring."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engine": "active"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
