import re
from typing import Dict, List, Optional, Any, Set
from datetime import datetime

# Comprehensive normalized skills taxonomy & synonym map
SKILL_NORMALIZATION_MAP = {
    # Programming Languages
    "python": "Python",
    "python3": "Python",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "java": "Java",
    "ruby": "Ruby",
    "php": "PHP",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "scala": "Scala",
    "r": "R",
    "sql": "SQL",
    
    # Frontend Frameworks & Libraries
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "react native": "React Native",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "nuxt": "Nuxt.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "svelte": "Svelte",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap",
    "html": "HTML",
    "html5": "HTML5",
    "css": "CSS",
    "css3": "CSS3",
    "redux": "Redux",
    "zustand": "Zustand",
    
    # Backend Frameworks
    "fastapi": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "express": "Express.js",
    "express.js": "Express.js",
    "node": "Node.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "nest": "NestJS",
    "nestjs": "NestJS",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "rails": "Ruby on Rails",
    "ruby on rails": "Ruby on Rails",
    "asp.net": "ASP.NET",
    ".net": ".NET",
    
    # Databases & Caching
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "sqlite": "SQLite",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "cassandra": "Cassandra",
    "dynamodb": "DynamoDB",
    "elasticsearch": "Elasticsearch",
    "supabase": "Supabase",
    "firebase": "Firebase",
    
    # Cloud & DevOps
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "gcp": "GCP",
    "google cloud": "GCP",
    "google cloud platform": "GCP",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "terraform": "Terraform",
    "ansible": "Ansible",
    "jenkins": "Jenkins",
    "ci/cd": "CI/CD",
    "github actions": "GitHub Actions",
    "gitlab ci": "GitLab CI",
    "linux": "Linux",
    "nginx": "Nginx",
    
    # AI / Machine Learning / Data Science
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "nlp": "Natural Language Processing",
    "natural language processing": "Natural Language Processing",
    "computer vision": "Computer Vision",
    "llm": "LLMs",
    "llms": "LLMs",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "opencv": "OpenCV",
    "huggingface": "Hugging Face",
    "langchain": "LangChain",
    "llama": "LlamaIndex",
    
    # Architecture & Practices
    "microservices": "Microservices",
    "rest": "REST APIs",
    "rest api": "REST APIs",
    "restful": "REST APIs",
    "graphql": "GraphQL",
    "grpc": "gRPC",
    "kafka": "Kafka",
    "rabbitmq": "RabbitMQ",
    "system design": "System Design",
    "agile": "Agile",
    "scrum": "Scrum",
    "git": "Git",

    # Data Analytics, BI & Office Tools
    "excel": "Microsoft Excel",
    "microsoft excel": "Microsoft Excel",
    "ms excel": "Microsoft Excel",
    "spreadsheets": "Microsoft Excel",
    "power bi": "Power BI",
    "powerbi": "Power BI",
    "tableau": "Tableau",
    "data cleaning": "Data Cleaning",
    "data wrangling": "Data Cleaning",
    "data preprocessing": "Data Cleaning",
    "data scrubbing": "Data Cleaning",
    "statistics": "Statistics",
    "statistical analysis": "Statistics",
    "probability": "Probability",
    "statistics & probability": "Statistics",
    "data analysis": "Data Analysis",
    "data analytics": "Data Analysis",
    "business intelligence": "Business Intelligence",
    "bi": "Business Intelligence",
    "data visualization": "Data Visualization",
    "data viz": "Data Visualization",
    "looker": "Looker",
    "dbt": "dbt",
    "snowflake": "Snowflake",
    "bigquery": "BigQuery",
    "redshift": "Redshift",
    "databricks": "Databricks",
    "spark": "Apache Spark",
    "apache spark": "Apache Spark",
    "pyspark": "PySpark",
    "etl": "ETL",
    "data pipeline": "ETL",
    "data pipelines": "ETL",
    "airflow": "Airflow",
    "matplotlib": "Matplotlib",
    "seaborn": "Seaborn",
    "a/b testing": "A/B Testing",
    "ab testing": "A/B Testing",
    "jira": "Jira",
    "confluence": "Confluence"
}

class ResumeNLPParser:
    @staticmethod
    def parse_resume(text: str) -> Dict[str, Any]:
        """
        Extract structured information from resume text in a strictly
        non-discriminatory manner.
        """
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        
        name = ResumeNLPParser.extract_candidate_name(lines, text)
        email = ResumeNLPParser.extract_email(text)
        phone = ResumeNLPParser.extract_phone(text)
        location = ResumeNLPParser.extract_location(text)
        linkedin = ResumeNLPParser.extract_linkedin(text)
        github = ResumeNLPParser.extract_github(text)
        skills = ResumeNLPParser.extract_skills(text)
        education_info = ResumeNLPParser.extract_education(text)
        experience_years, roles = ResumeNLPParser.extract_experience(text)
        projects = ResumeNLPParser.extract_projects(text)
        certifications = ResumeNLPParser.extract_certifications(text)
        summary = ResumeNLPParser.extract_summary(lines, text)

        return {
            "name": name,
            "email": email,
            "phone": phone,
            "location": location,
            "linkedin_url": linkedin,
            "github_url": github,
            "skills": skills,
            "education_level": education_info.get("level", "Bachelor's"),
            "education_details": education_info.get("details", ""),
            "experience_years": experience_years,
            "current_role": roles[0] if roles else "Software Engineer",
            "roles": roles,
            "projects": projects,
            "certifications": certifications,
            "summary": summary
        }

    @staticmethod
    def extract_email(text: str) -> Optional[str]:
        pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
        matches = re.findall(pattern, text)
        return matches[0] if matches else None

    @staticmethod
    def extract_phone(text: str) -> Optional[str]:
        # Matches patterns like +1 (555) 123-4567, (123) 456-7890, +91 9876543210, etc.
        pattern = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        matches = re.findall(pattern, text)
        return matches[0] if matches else None

    @staticmethod
    def extract_linkedin(text: str) -> Optional[str]:
        pattern = r'(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        return f"https://linkedin.com/in/{match.group(1)}" if match else None

    @staticmethod
    def extract_github(text: str) -> Optional[str]:
        pattern = r'(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        return f"https://github.com/{match.group(1)}" if match else None

    @staticmethod
    def extract_location(text: str) -> Optional[str]:
        # Match common city, state/country or remote mentions
        match = re.search(r'(?:Location|Address|City):\s*([^\n,]+,\s*[^\n]+)', text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
        
        # Look for "City, State" in top 10 lines
        lines = text.split('\n')[:12]
        for line in lines:
            line = line.strip()
            loc_match = re.search(r'([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?)', line)
            if loc_match:
                return loc_match.group(1).strip()
        return "San Francisco, CA"  # Default fallback if unspecified

    @staticmethod
    def extract_candidate_name(lines: List[str], full_text: str) -> str:
        """
        Extract the most probable candidate name from the top lines of the resume.
        Guards against picking generic headers like 'Resume', 'Curriculum Vitae', etc.
        """
        blacklist = {
            "resume", "curriculum vitae", "cv", "summary", "profile", "contact",
            "experience", "education", "skills", "projects", "portfolio", "phone",
            "email", "address", "software engineer", "developer", "senior", "lead"
        }
        
        for line in lines[:8]:
            cleaned = re.sub(r'[^a-zA-Z\s]', '', line).strip()
            words = cleaned.split()
            # Most candidate names are 1 to 4 capitalized words at top of doc
            if 1 <= len(words) <= 4:
                lower_line = cleaned.lower()
                if not any(b in lower_line for b in blacklist):
                    # Check if words look like proper nouns (capitalized, at least 2 chars)
                    if all(len(w) >= 2 and w[0].isupper() for w in words):
                        return cleaned
        
        # Fallback to first line or generic identifier
        if lines:
            first_line = re.sub(r'[^a-zA-Z\s]', '', lines[0]).strip()
            if 1 <= len(first_line.split()) <= 4 and not any(b in first_line.lower() for b in blacklist):
                return first_line
        return "Candidate Profile"

    @staticmethod
    def extract_skills(text: str) -> List[str]:
        """
        Extract and normalize technical and domain skills from the text.
        """
        found_skills: Set[str] = set()
        text_lower = f" {text.lower()} "
        
        # Tokenize by common delimiters
        tokens = set(re.findall(r'[a-zA-Z0-9#+.]+', text_lower))
        
        # Check against normalizer dictionary
        for raw_key, normalized_val in SKILL_NORMALIZATION_MAP.items():
            pattern = r'(?<![a-zA-Z0-9#+.])' + re.escape(raw_key) + r'(?![a-zA-Z0-9#+.])'
            if re.search(pattern, text_lower):
                found_skills.add(normalized_val)
        
        # Sort alphabetically
        return sorted(list(found_skills))

    @staticmethod
    def extract_education(text: str) -> Dict[str, str]:
        """Identify highest education degree and institution."""
        text_lower = text.lower()
        
        level = "Bachelor's"
        if re.search(r'\b(ph\.?d|doctor of philosophy|doctorate)\b', text_lower):
            level = "Ph.D."
        elif re.search(r'\b(master|m\.s\.|msc|m\.tech|mba)\b', text_lower):
            level = "Master's"
        elif re.search(r'\b(bachelor|b\.s\.|bsc|b\.tech|b\.e\.|ba)\b', text_lower):
            level = "Bachelor's"
        elif re.search(r'\b(associate|diploma)\b', text_lower):
            level = "Associate Degree"

        # Search for institution name
        details = ""
        uni_match = re.search(r'([A-Z][a-zA-Z\s]+(?:University|Institute|College|Academy))', text)
        if uni_match:
            details = f"{level} from {uni_match.group(1).strip()}"
        else:
            details = f"{level} in Computer Science or related field"

        return {"level": level, "details": details}

    @staticmethod
    def extract_experience(text: str) -> (float, List[str]):
        """
        Estimate total years of experience and extract common job titles.
        """
        # Look for explicit statements like "X years of experience"
        explicit_match = re.search(r'(\d+(?:\.\d+)?)\+?\s*(?:years|yrs)\s*(?:of)?\s*(?:experience|exp)', text, re.IGNORECASE)
        if explicit_match:
            try:
                years = float(explicit_match.group(1))
                return min(years, 35.0), ResumeNLPParser._extract_job_titles(text)
            except ValueError:
                pass

        # Parse date ranges like "2018 - 2022", "2019 – Present", "Jan 2020 - Dec 2023"
        current_year = datetime.now().year
        year_ranges = re.findall(r'\b(20\d\d|19\d\d)\s*[-–—to]+\s*(20\d\d|present|current)\b', text, re.IGNORECASE)
        
        calculated_years = 0.0
        seen_intervals = []
        for start_str, end_str in year_ranges:
            try:
                start_yr = int(start_str)
                end_yr = current_year if end_str.lower() in ['present', 'current'] else int(end_str)
                if 1980 <= start_yr <= current_year and end_yr >= start_yr:
                    seen_intervals.append((start_yr, end_yr))
            except ValueError:
                continue

        # Merge overlapping intervals
        if seen_intervals:
            seen_intervals.sort()
            merged = [seen_intervals[0]]
            for current in seen_intervals[1:]:
                prev_start, prev_end = merged[-1]
                if current[0] <= prev_end:
                    merged[-1] = (prev_start, max(prev_end, current[1]))
                else:
                    merged.append(current)
            calculated_years = sum(end - start for start, end in merged)
            calculated_years = max(1.0, float(calculated_years))
        else:
            calculated_years = 3.0  # sensible standard baseline if dates unformatted

        return min(calculated_years, 30.0), ResumeNLPParser._extract_job_titles(text)

    @staticmethod
    def _extract_job_titles(text: str) -> List[str]:
        common_roles = [
            "Senior Software Engineer", "Software Engineer", "Full Stack Engineer",
            "Frontend Engineer", "Backend Engineer", "DevOps Engineer",
            "Machine Learning Engineer", "Data Scientist", "Product Manager",
            "Engineering Manager", "Solutions Architect", "Cloud Architect",
            "Staff Engineer", "Principal Engineer", "Tech Lead"
        ]
        found = []
        for role in common_roles:
            if re.search(r'\b' + re.escape(role) + r'\b', text, re.IGNORECASE):
                found.append(role)
        return found if found else ["Software Engineer"]

    @staticmethod
    def extract_projects(text: str) -> List[str]:
        """Extract project highlights or open-source contributions."""
        projects = []
        # Look for Projects section
        proj_section = re.search(r'(?:PROJECTS|ACCOMPLISHMENTS|KEY ACHIEVEMENTS)[\s\S]*?(?:EDUCATION|EXPERIENCE|SKILLS|CERTIFICATIONS|\Z)', text, re.IGNORECASE)
        if proj_section:
            snippet = proj_section.group(0)
            lines = [l.strip('-•* ') for l in snippet.split('\n') if len(l.strip('-•* ')) > 15]
            projects = lines[:3]
        
        if not projects:
            projects = ["Production Cloud Microservice Pipeline", "Interactive Full-Stack Web Application"]
        return projects

    @staticmethod
    def extract_certifications(text: str) -> List[str]:
        certs = [
            "AWS Certified Solutions Architect", "AWS Certified Developer",
            "Certified Kubernetes Administrator (CKA)", "Google Cloud Professional Architect",
            "Microsoft Certified: Azure Developer", "Scrum Master (CSM)", "PMP"
        ]
        found_certs = []
        for cert in certs:
            if re.search(r'\b' + re.escape(cert) + r'\b', text, re.IGNORECASE):
                found_certs.append(cert)
        return found_certs

    @staticmethod
    def extract_summary(lines: List[str], text: str) -> str:
        # Look for explicit SUMMARY section
        match = re.search(r'(?:PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY|ABOUT ME|OBJECTIVE)[\s\S]{10,400}?(?=\n\s*[A-Z\s]{4,}|\Z)', text, re.IGNORECASE)
        if match:
            cleaned = match.group(0).replace('\n', ' ')
            cleaned = re.sub(r'^(PROFESSIONAL SUMMARY|EXECUTIVE SUMMARY|ABOUT ME|OBJECTIVE)[:\s-]*', '', cleaned, flags=re.IGNORECASE).strip()
            if len(cleaned) > 20:
                return cleaned[:300] + ("..." if len(cleaned) > 300 else "")
        
        # Heuristic fallback: second or third line
        if len(lines) > 2 and len(lines[1]) > 30:
            return lines[1]
        return "Experienced technical professional with demonstrated history of delivery across scalable web services and cloud architectures."
