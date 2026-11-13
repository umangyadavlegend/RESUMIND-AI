import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

import pytest
from starlette.testclient import TestClient
from app.main import app
from app.services.extractor import DocumentExtractor, DocumentExtractionError
from app.services.nlp_parser import ResumeNLPParser
from app.services.matcher import CandidateMatcher

@pytest.fixture
def client():
    with TestClient(app, base_url="http://testserver") as client:
        yield client

def test_health_check(client):
    """Verify health endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "RESUMIND AI"

def test_nlp_parser_skills_and_normalization():
    """Verify skills extraction, normalization, and contact details."""
    sample_text = """
    Alex Morgan
    alex.morgan@example.com | (415) 555-0199 | San Francisco, CA
    linkedin.com/in/alexmorgan | github.com/alexmorgan

    PROFESSIONAL SUMMARY
    Senior Software Engineer with 5 years of experience in distributed systems.

    TECHNICAL SKILLS
    Python, FastAPI, react.js, TypeScript, PostgreSQL database, Docker, Kubernetes, AWS Cloud

    EXPERIENCE
    Lead Engineer at Nexus Corp (2020 - Present)
    - Built microservices using FastAPI and PostgreSQL.
    
    Software Developer at Alpha Inc (2018 - 2020)
    - Developed frontend components with React.

    EDUCATION
    B.S. in Computer Science from UC Berkeley
    """

    parsed = ResumeNLPParser.parse_resume(sample_text)
    assert parsed["name"] == "Alex Morgan"
    assert parsed["email"] == "alex.morgan@example.com"
    assert "Python" in parsed["skills"]
    assert "FastAPI" in parsed["skills"]
    assert "React" in parsed["skills"]  # Normalized from react.js
    assert "PostgreSQL" in parsed["skills"]  # Normalized from PostgreSQL database
    assert "Docker" in parsed["skills"]
    assert parsed["experience_years"] >= 4.0
    assert parsed["education_level"] == "Bachelor's"

def test_matcher_4_pillar_weighted_formula():
    """
    Verify the 4-pillar formula:
    Overall Score = (Skills * 0.50) + (Experience * 0.30) + (Education * 0.10) + (Projects * 0.10)
    """
    candidate_data = {
        "name": "Alex Morgan",
        "skills": ["Python", "FastAPI", "React", "SQL"],
        "experience_years": 4.0,
        "education_level": "Bachelor's",
        "projects": ["High throughput API", "Interactive React Dashboard"],
        "certifications": ["AWS Certified Developer"]
    }

    job_data = {
        "required_skills": "Python, FastAPI, React, SQL, Docker",
        "preferred_skills": "Kubernetes, AWS",
        "min_experience_years": 3,
        "min_education": "Bachelor's"
    }

    result = CandidateMatcher.match_candidate_to_job(candidate_data, job_data)
    
    # Check component scores exist
    assert "overall_score" in result
    assert "skills_score" in result
    assert "experience_score" in result
    assert "education_score" in result
    assert "projects_score" in result
    assert "Docker" in result["missing_skills"]
    assert "Python" in result["matched_skills"]
    
    # Verify weighted math
    expected_score = round(
        (result["skills_score"] * 0.50) +
        (result["experience_score"] * 0.30) +
        (result["education_score"] * 0.10) +
        (result["projects_score"] * 0.10),
        1
    )
    assert abs(result["overall_score"] - expected_score) < 0.2
    assert "Strong match" in result["recommendation"] or "Moderate match" in result["recommendation"]

def test_auth_and_protected_flow(client):
    """Test user registration and login flow."""
    unique_email = f"test_recruiter_{os.urandom(4).hex()}@resumind.ai"
    reg_payload = {
        "email": unique_email,
        "password": "SecurePassword123!",
        "full_name": "Test Recruiter",
        "company_name": "Antigravity Labs",
        "role": "recruiter"
    }
    # Register
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]

    # Login
    login_resp = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # Me
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == unique_email

def test_job_crud_endpoints(client):
    """Test job description creation and retrieval."""
    job_payload = {
        "title": "Principal AI Architect",
        "department": "AI Research",
        "location": "Remote",
        "employment_type": "Full-time",
        "description": "Lead design and deployment of large multimodal document architectures.",
        "required_skills": "Python, PyTorch, Docker, Kubernetes, LLMs",
        "preferred_skills": "FastAPI, React",
        "min_experience_years": 6,
        "min_education": "Master's"
    }
    create_resp = client.post("/api/jobs", json=job_payload)
    assert create_resp.status_code == 201
    job_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/jobs/{job_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "Principal AI Architect"

def test_seed_demo_and_analytics(client):
    """Test demo data seeding and analytics computation."""
    seed_resp = client.post("/api/settings/seed-demo")
    assert seed_resp.status_code == 200

    analytics_resp = client.get("/api/analytics/overview")
    assert analytics_resp.status_code == 200
    data = analytics_resp.json()
    assert data["active_jobs"] >= 1
    assert data["avg_match_score"] > 0
    assert len(data["score_distribution"]) == 5

def test_document_extractor_validations():
    """Verify document extractor handles invalid formats and empty bytes gracefully."""
    with pytest.raises(DocumentExtractionError):
        DocumentExtractor.extract_text(b"", "empty.pdf")

    with pytest.raises(DocumentExtractionError):
        DocumentExtractor.extract_text(b"corrupted binary", "corrupt.exe")
