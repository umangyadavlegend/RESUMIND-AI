# RESUMIND AI — Intelligent Resume Screening & Candidate Ranking

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live%20Demo-brightgreen?style=for-the-badge&logo=vercel)](https://resumind-ai-gx7e.vercel.app/)
[![GitHub Repository](https://img.shields.io/badge/GitHub-RESUMIND--AI-181717?style=for-the-badge&logo=github)](https://github.com/umangyadavlegend/RESUMIND-AI)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

> 🚀 **Live Production Application:** [https://resumind-ai-gx7e.vercel.app/](https://resumind-ai-gx7e.vercel.app/)  
> **"Find the right talent. Faster. Smarter."**  
> A cinematic, production-quality AI recruitment platform engineered with a dark high-contrast design system, multi-format resume parsing (PDF & DOCX), 250+ normalized skills taxonomy, and an explainable 4-pillar candidate ranking engine.

---

## 1. Overview & Key Capabilities

RESUMIND AI was architected from the ground up to eliminate the black-box opacity of conventional recruitment screeners. Every candidate score is calculated deterministically, audit-ready, and accompanied by natural language rationale that empowers human recruiters.

- **Real User Authentication with Email OTP**:
  - Real account registration with name, email, phone number, and bcrypt-hashed passwords.
  - 2-step verification using cryptographically secure 6-digit OTPs delivered via SMTP.
  - Development Mailbox fallback for local development preview without live mail servers.
- **Enterprise Session Management**:
  - Authentic `HttpOnly` cookie session management (`resumind_session`) with server-side database invalidation.
  - Zero token exposure in `localStorage`.
- **Dedicated Logout & Route Protection**:
  - Complete server session invalidation on logout, clearing cookies, and blocking browser back navigation to private dashboard routes.
- **Multi-Format Extraction**:
  - Ingests batch PDF and DOCX files, extracting candidate entities, career histories, graduation dates, and contact links.
- **250+ Normalized Skills Taxonomy**:
  - Comprehensive coverage of Software Engineering, Data Analytics, BI, Data Science, Cloud, and DevOps.
  - Automatic standardization of synonyms (e.g. `Excel` -> `Microsoft Excel`, `powerbi` -> `Power BI`, `k8s` -> `Kubernetes`).
  - Intelligent substring and alias matching for domain keywords.
- **4-Pillar Transparent Scoring**:
  $$\text{Overall Score} = (\text{Skills} \times 0.50) + (\text{Experience} \times 0.30) + (\text{Education} \times 0.10) + (\text{Projects} \times 0.10)$$
- **Explainable AI Recommendations**:
  - Breaks down why an applicant succeeded or where gaps exist (matched vs missing skills) with decision-support guidance.
- **Recruiter Human-in-the-Loop**:
  - Recruiters retain complete authority with manual status overrides (Shortlist, Review, Reject), side-by-side comparison, and 1-click CSV report exports.
- **Ethical AI & Zero Demographic Bias**:
  - Strict exclusion of age, gender, race, religion, photo, and address from all mathematical evaluation models.
- **Enterprise Data Retention**:
  - 1-click purge of uploaded binary files and parsed candidate records for strict GDPR compliance.

---

## 2. Technology Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** bundler
- **Tailwind CSS** (Custom cinematic dark palette: `#090909` canvas, `#141414` surface, `#1B1B1B` cards, `#E53945` crimson accent)
- **Framer Motion** (Smooth transitions, progress indicators, modals)
- **Recharts** (Candidate score distribution, skills frequency, performance metrics)
- **Lucide React** (Consistent iconography)

### Backend
- **Python 3.12**
- **FastAPI** (High-throughput async REST endpoints)
- **SQLAlchemy 2.0** ORM (SQLite for local zero-config testing; 100% PostgreSQL compatible)
- **Pydantic v2** (Strict schema validation)
- **PyPDF** & **python-docx** (Document stream parsers)
- **PyJWT** & **Bcrypt** (Secure authentication and password hashing)
- **Pytest** & **HTTPX** (Automated test suites)

---

## 3. Project Architecture

```
RESUMIND-AI/
├── backend/
│   ├── app/
│   │   ├── api/              # REST Endpoints (auth, jobs, resumes, screening, candidates, reports, analytics, settings)
│   │   ├── core/             # Configuration, Database Engine (SQLite & PostgreSQL), Security & JWT
│   │   ├── models/           # SQLAlchemy ORM Models (User, Job, Resume, Candidate, Score, Report, Session, OTP)
│   │   ├── schemas/          # Pydantic v2 validation schemas
│   │   ├── services/         # Extraction, NLP taxonomy parser, 4-pillar matcher, email delivery, CSV export
│   │   └── main.py           # FastAPI entrypoint, CORS & error handlers
│   ├── tests/                # Automated pytest suite & end-to-end integration tests
│   ├── uploads/              # Local storage for uploaded documents
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # UI Components (Sidebar, Navbar, ScoreBadge, Modals, CandidateCard, etc.)
│   │   ├── pages/            # LandingPage, AuthPage, DashboardOverview, ScreeningWorkspace, CandidateRankingPage, etc.
│   │   ├── layouts/          # Responsive DashboardLayout
│   │   ├── services/         # Typed API Client (with cookie auth & error handling)
│   │   └── types/            # TypeScript data models
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Custom brand theme tokens
│   └── vite.config.ts        # Vite proxy configuration
├── docs/                     # Design system and architectural documentation
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore configuration
└── README.md
```

---

## 4. Local Quickstart Guide

### Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** & **npm**
- **Git**

### Step 1: Clone the Repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd RESUMIND-AI
```

### Step 2: Backend Setup
```bash
# 1. Navigate to backend
cd backend

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy environment configuration
cp ../.env.example .env

# 5. Start the FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The FastAPI backend and interactive Swagger documentation will be live at:*  
👉 **http://127.0.0.1:8000/api/docs**

### Step 3: Frontend Setup (in a separate terminal)
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install npm packages
npm install

# 3. Run Vite development server
npm run dev
```
*The React application will be live at:*  
👉 **http://127.0.0.1:3000**

---

## 5. Running Automated Tests

Run the complete backend security and functional test suite:

```bash
cd backend
python tests/verify_all_requirements.py
```

Run unit tests via Pytest:

```bash
python -m pytest tests/ -v
```

---

## 6. Production Deployment Guide

### Frontend Live on Vercel
- **Official Live URL**: [https://resumind-ai-gx7e.vercel.app/](https://resumind-ai-gx7e.vercel.app/)
- **Continuous Integration**: Connected to GitHub repository `umangyadavlegend/RESUMIND-AI`. Every commit pushed to `main` automatically triggers a zero-downtime production deployment on Vercel.

### Frontend Deployment Settings
1. Root Directory: `./` (or `frontend`)
2. Build Command: `npm run build`
3. Output Directory: `dist` (or `frontend/dist`)
4. Environment Variables:
   - `VITE_API_BASE=https://your-backend-domain.com/api` (points to your hosted FastAPI backend)

### Backend Deployment (Render / Railway / Fly.io / AWS ECS)
1. Create a new Web Service pointing to the `backend/` directory.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Attach a managed **PostgreSQL** database (e.g., Neon, Supabase, Railway Postgres).
5. Configure Environment Variables:
   - `DATABASE_URL=postgresql://user:password@hostname:5432/resumind`
   - `SECRET_KEY=your_generated_cryptographic_secret_key`
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USERNAME=your-email@gmail.com`
   - `SMTP_PASSWORD=your-app-specific-password`
   - `SMTP_FROM_EMAIL=your-email@gmail.com`
   - `SMTP_FROM_NAME=RESUMIND AI`

---

## 7. License & Ethical AI Compliance

RESUMIND AI is provided for professional recruitment decision-support. In strict alignment with modern hiring regulations (including NYC Local Law 144, EEOC guidelines, and EU AI Act principles):
- Demographic attributes are mathematically excluded from all evaluation formulas.
- This platform does not make automated employment decisions or rejections; all hiring outcomes require verified human recruiter evaluation.
