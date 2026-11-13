from typing import Dict, List, Any, Tuple
import math
from app.services.nlp_parser import SKILL_NORMALIZATION_MAP

class CandidateMatcher:
    """
    Explainable AI Matching Engine adhering to strict non-discriminatory
    recruitment guidelines and transparent 4-pillar weighted scoring:
    Overall Score = (Skills * 0.50) + (Experience * 0.30) + (Education * 0.10) + (Projects * 0.10)
    """

    @staticmethod
    def match_candidate_to_job(
        candidate_data: Dict[str, Any],
        job_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates all component scores and generates an explainable recommendation.
        """
        # 1. Parse required and preferred skills
        req_skills_raw = job_data.get("required_skills", "")
        pref_skills_raw = job_data.get("preferred_skills", "")
        
        required_skills = CandidateMatcher._normalize_skill_list(req_skills_raw)
        preferred_skills = CandidateMatcher._normalize_skill_list(pref_skills_raw)
        
        candidate_skills = candidate_data.get("skills", [])
        if isinstance(candidate_skills, str):
            candidate_skills = [s.strip() for s in candidate_skills.split(',') if s.strip()]

        # Compute skills match with intelligent alias and substring awareness
        candidate_skills_set = set(candidate_skills)
        candidate_skills_lower = {s.lower().strip(): s for s in candidate_skills}
        
        matched_skills = []
        missing_skills = []
        for req in required_skills:
            req_clean = req.strip()
            req_lower = req_clean.lower()
            
            # Direct match
            if req_clean in candidate_skills_set or req_lower in candidate_skills_lower:
                matched_skills.append(req_clean)
            # Normalization alias check
            elif req_lower in SKILL_NORMALIZATION_MAP and SKILL_NORMALIZATION_MAP[req_lower].lower() in candidate_skills_lower:
                matched_skills.append(req_clean)
            # Substring / partial match (e.g. "Excel" in "Microsoft Excel", "Statistics" in "Statistics & Probability")
            elif any(req_lower == cs.lower() or (len(req_lower) >= 4 and req_lower in cs.lower()) or (len(cs) >= 4 and cs.lower() in req_lower) for cs in candidate_skills):
                matched_skills.append(req_clean)
            else:
                missing_skills.append(req_clean)

        matched_preferred = []
        for pref in preferred_skills:
            pref_clean = pref.strip()
            pref_lower = pref_clean.lower()
            if pref_clean in candidate_skills_set or pref_lower in candidate_skills_lower:
                matched_preferred.append(pref_clean)
            elif any(pref_lower == cs.lower() or (len(pref_lower) >= 4 and pref_lower in cs.lower()) for cs in candidate_skills):
                matched_preferred.append(pref_clean)

        # Calculate Skills Score (0 - 100)
        skills_score = CandidateMatcher._calculate_skills_score(
            required_skills, matched_skills, preferred_skills, matched_preferred
        )

        # 2. Calculate Experience Score (0 - 100)
        cand_exp = float(candidate_data.get("experience_years", 0.0) or 0.0)
        min_exp = float(job_data.get("min_experience_years", 2) or 2)
        experience_score = CandidateMatcher._calculate_experience_score(cand_exp, min_exp)

        # 3. Calculate Education Score (0 - 100)
        cand_edu = candidate_data.get("education_level", "Bachelor's")
        req_edu = job_data.get("min_education", "Bachelor's")
        education_score = CandidateMatcher._calculate_education_score(cand_edu, req_edu)

        # 4. Calculate Projects and Certifications Score (0 - 100)
        cand_projects = candidate_data.get("projects", [])
        cand_certs = candidate_data.get("certifications", [])
        projects_score = CandidateMatcher._calculate_projects_score(cand_projects, cand_certs)

        # 5. Overall Weighted Formula:
        # Overall = (Skills * 0.50) + (Experience * 0.30) + (Education * 0.10) + (Projects * 0.10)
        overall_score = round(
            (skills_score * 0.50) +
            (experience_score * 0.30) +
            (education_score * 0.10) +
            (projects_score * 0.10),
            1
        )
        # Cap between 0 and 100
        overall_score = max(0.0, min(100.0, overall_score))

        # 6. Generate human-readable explanation and recommendation
        explanation, recommendation = CandidateMatcher._generate_explanation(
            candidate_name=candidate_data.get("name", "Candidate"),
            overall_score=overall_score,
            skills_score=skills_score,
            experience_score=experience_score,
            education_score=education_score,
            projects_score=projects_score,
            matched_skills=matched_skills,
            missing_skills=missing_skills,
            cand_exp=cand_exp,
            min_exp=min_exp,
            cand_edu=cand_edu,
            req_edu=req_edu,
            matched_preferred=matched_preferred
        )

        return {
            "overall_score": overall_score,
            "skills_score": round(skills_score, 1),
            "experience_score": round(experience_score, 1),
            "education_score": round(education_score, 1),
            "projects_score": round(projects_score, 1),
            "matched_skills": ", ".join(matched_skills),
            "missing_skills": ", ".join(missing_skills),
            "explanation": explanation,
            "recommendation": recommendation
        }

    @staticmethod
    def _normalize_skill_list(skills_input: Any) -> List[str]:
        if not skills_input:
            return []
        if isinstance(skills_input, list):
            items = skills_input
        else:
            items = [s.strip() for s in str(skills_input).split(',') if s.strip()]
        
        normalized = []
        for item in items:
            key = item.lower().strip()
            norm = SKILL_NORMALIZATION_MAP.get(key, item.strip())
            if norm not in normalized:
                normalized.append(norm)
        return normalized

    @staticmethod
    def _calculate_skills_score(
        required: List[str],
        matched: List[str],
        preferred: List[str],
        matched_pref: List[str]
    ) -> float:
        if not required:
            return 85.0  # If no strict skills requested, default baseline
        
        ratio = len(matched) / len(required)
        base_score = ratio * 90.0  # Matching 100% of required gives 90
        
        # Preferred skills bonus (up to 10 points)
        pref_bonus = 0.0
        if preferred and matched_pref:
            pref_bonus = (len(matched_pref) / len(preferred)) * 10.0
        elif not preferred and ratio == 1.0:
            pref_bonus = 10.0
            
        return min(100.0, base_score + pref_bonus)

    @staticmethod
    def _calculate_experience_score(candidate_years: float, required_years: float) -> float:
        if required_years <= 0:
            return 90.0
        
        if candidate_years >= required_years:
            # Full base score + bonus for seniority up to 100
            excess = candidate_years - required_years
            score = 85.0 + min(15.0, excess * 3.0)
            return min(100.0, score)
        else:
            # Prorated score when below required minimum
            ratio = candidate_years / required_years
            return max(30.0, ratio * 80.0)

    @staticmethod
    def _calculate_education_score(candidate_edu: str, required_edu: str) -> float:
        rankings = {
            "High School": 50.0,
            "Associate Degree": 65.0,
            "Bachelor's": 85.0,
            "Master's": 95.0,
            "Ph.D.": 100.0
        }
        cand_val = rankings.get(candidate_edu, 80.0)
        req_val = rankings.get(required_edu, 85.0)

        if cand_val >= req_val:
            return min(100.0, cand_val + 5.0)
        else:
            return max(40.0, cand_val - 15.0)

    @staticmethod
    def _calculate_projects_score(projects: List[str], certs: List[str]) -> float:
        score = 70.0
        # Projects bonus
        if projects:
            score += min(15.0, len(projects) * 5.0)
        # Certifications bonus
        if certs:
            score += min(15.0, len(certs) * 7.5)
        return min(100.0, score)

    @staticmethod
    def _generate_explanation(
        candidate_name: str,
        overall_score: float,
        skills_score: float,
        experience_score: float,
        education_score: float,
        projects_score: float,
        matched_skills: List[str],
        missing_skills: List[str],
        cand_exp: float,
        min_exp: float,
        cand_edu: str,
        req_edu: str,
        matched_preferred: List[str]
    ) -> Tuple[str, str]:
        """
        Creates an audit-ready, natural-language breakdown of the scoring rationale.
        """
        status_category = (
            "Strong Match" if overall_score >= 80
            else "Moderate Match" if overall_score >= 60
            else "Low Match"
        )
        
        # Detail skills breakdown
        if matched_skills:
            matched_str = f"Demonstrates core competency in {', '.join(matched_skills[:5])}"
            if len(matched_skills) > 5:
                matched_str += f" (+{len(matched_skills)-5} more)"
        else:
            matched_str = "No direct matches found for the primary required technical skills"

        if missing_skills:
            missing_str = f"Key required skills not explicitly evidenced: {', '.join(missing_skills)}"
        else:
            missing_str = "Exhibits 100% of all required core technical competencies"

        # Detail experience breakdown
        if cand_exp >= min_exp:
            exp_str = f"{cand_exp:.1f} years of relevant experience meets or exceeds the required {min_exp:.0f} year baseline"
        else:
            exp_str = f"{cand_exp:.1f} years of experience falls below the preferred threshold of {min_exp:.0f} years"

        # Combine into cohesive narrative explanation
        explanation_body = (
            f"**Candidate Evaluation ({status_category})**:\n"
            f"• **Skills Match ({skills_score:.0f}/100)**: {matched_str}. {missing_str}.\n"
            f"• **Experience Relevance ({experience_score:.0f}/100)**: {exp_str}.\n"
            f"• **Education Alignment ({education_score:.0f}/100)**: Holds {cand_edu} (Target: {req_edu}).\n"
            f"• **Projects & Portfolio ({projects_score:.0f}/100)**: Production background evidenced in project delivery."
        )

        # Recommendation
        if overall_score >= 80:
            rec = "Strong match based on available resume information. Highly recommended for technical phone screen or recruiter interview."
        elif overall_score >= 60:
            rec = "Moderate match with viable qualifications. Human review recommended to assess missing skill depth or transferrable experience."
        else:
            rec = "Lower match to target criteria. Potential gap in required competencies or minimum tenure. Manual review recommended before rejection."

        return explanation_body, rec
