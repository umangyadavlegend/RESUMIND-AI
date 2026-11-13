import os
import glob
import httpx

BASE_URL = "http://127.0.0.1:8000/api"

def run_e2e_test():
    print("=== STARTING END-TO-END SCREENING WORKFLOW TEST ===")
    
    client = httpx.Client(base_url=BASE_URL)

    # 1. Check health
    health_resp = client.get("/health")
    assert health_resp.status_code == 200, f"Health failed: {health_resp.text}"
    print("[1/6] Health Check: PASSED")

    # 2. Establish recruiter session
    login_resp = client.post("/auth/demo-login")
    assert login_resp.status_code == 200, f"Demo login failed: {login_resp.text}"
    print("[2/6] Recruiter Session Established: PASSED")

    # 3. Upload sample resumes
    sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_resumes"))
    sample_files = glob.glob(os.path.join(sample_dir, "*.*"))
    print(f"Found {len(sample_files)} sample files to upload: {[os.path.basename(f) for f in sample_files]}")

    uploaded_ids = []
    for file_path in sample_files:
        filename = os.path.basename(file_path)
        with open(file_path, "rb") as f:
            files = [("files", (filename, f.read(), "application/octet-stream"))]
            resp = client.post("/resumes/upload", files=files)
            assert resp.status_code == 201, f"Failed uploading {filename}: {resp.text}"
            data = resp.json()
            uploaded_ids.append(data[0]["id"])
            print(f"  -> Uploaded '{filename}' (ID: {data[0]['id']})")
    
    print(f"[3/6] Resume Uploads: PASSED ({len(uploaded_ids)} resumes)")

    # 4. Trigger 6-stage AI screening analysis
    screening_payload = {
        "job_title": "Senior Cloud Software Engineer",
        "job_description": "We need a Senior Cloud Software Engineer proficient in Python, FastAPI, Docker, and Kubernetes with 3+ years experience.",
        "required_skills": "Python, FastAPI, Docker, SQL",
        "preferred_skills": "Kubernetes, AWS, React, TypeScript",
        "min_experience_years": 3,
        "min_education": "Bachelor's",
        "resume_ids": uploaded_ids
    }
    
    print("[4/6] Triggering AI Screening Analysis...")
    screen_resp = client.post("/screening/analyze", json=screening_payload)
    assert screen_resp.status_code == 200, f"Screening failed: {screen_resp.text}"
    screening_data = screen_resp.json()
    
    session = screening_data["session"]
    candidates = screening_data["candidates"]
    print(f"Screening completed! Session ID: {session['id']}, Avg Score: {session['average_score']}%")
    print(f"Ranked Leaderboard ({len(candidates)} Candidates):")
    for item in candidates:
        cand = item["candidate"]
        score = item["score"]
        print(f"  Rank #{item['rank']} | {cand['name']:<18} | Score: {score['overall_score']:>4.1f}% | Skills: {score['skills_score']}% | Exp: {score['experience_score']}% | Matched: {score['matched_skills']}")

    assert len(candidates) > 0, "No candidates returned"
    top_cand = candidates[0]
    assert top_cand["score"]["overall_score"] >= 70.0, "Top candidate should have strong score"
    print("[4/6] AI Screening & Ranking: PASSED")

    # 5. Test Recruiter Status Override (Shortlist top candidate)
    top_id = top_cand["candidate"]["id"]
    status_resp = client.patch(
        f"/candidates/{top_id}/status",
        json={"status": "shortlisted", "notes": "Exceptional technical qualifications and relevant experience."}
    )
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "shortlisted"
    print(f"[5/6] Recruiter Action (Shortlist Candidate #{top_id}): PASSED")

    # 6. Test Exporting CSV Report
    export_resp = client.get(f"/reports/{session['id']}/export?format=csv")
    assert export_resp.status_code == 200
    assert "Rank,Candidate Name" in export_resp.text
    print("[6/6] CSV Report Generation & Export: PASSED")
    
    print("\n=== ALL END-TO-END WORKFLOW TESTS SUCCEEDED! ===")

if __name__ == "__main__":
    run_e2e_test()
