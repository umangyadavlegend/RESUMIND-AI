import csv
import io
import json
from typing import List, Dict, Any

class ReportGenerator:
    @staticmethod
    def generate_csv(ranked_candidates: List[Dict[str, Any]], job_title: str) -> str:
        """Export screening results to a clean CSV format."""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header row
        writer.writerow([
            "Rank",
            "Candidate Name",
            "Email",
            "Phone",
            "Overall Match (%)",
            "Skills Score",
            "Experience Score",
            "Education Score",
            "Projects Score",
            "Experience (Years)",
            "Education",
            "Matched Skills",
            "Missing Skills",
            "Recruiter Recommendation"
        ])
        
        for item in ranked_candidates:
            cand = item.get("candidate", {})
            score = item.get("score", {})
            rank = item.get("rank", 1)
            
            writer.writerow([
                rank,
                cand.get("name", "N/A"),
                cand.get("email", "N/A"),
                cand.get("phone", "N/A"),
                score.get("overall_score", 0.0),
                score.get("skills_score", 0.0),
                score.get("experience_score", 0.0),
                score.get("education_score", 0.0),
                score.get("projects_score", 0.0),
                cand.get("experience_years", 0.0),
                cand.get("education_level", "N/A"),
                score.get("matched_skills", ""),
                score.get("missing_skills", ""),
                score.get("recommendation", "")
            ])
            
        return output.getvalue()
