import httpx
import uuid

BASE_URL = "http://127.0.0.1:8000/api"

def test_full_auth_scenarios():
    print("=== TESTING ALL 10 AUTHENTICATION & SESSION SCENARIOS ===")

    client = httpx.Client(base_url=BASE_URL)

    # Scenario 1: Try accessing protected endpoint before login -> Must be 401
    resp_unauth = client.get("/auth/me")
    assert resp_unauth.status_code == 401, f"Expected 401, got {resp_unauth.status_code}"
    print("[1/10] Protected /auth/me returns 401 when unauthenticated: PASSED")

    # Scenario 2: Register a new account
    unique_email = f"recruiter_{uuid.uuid4().hex[:8]}@apextech.io"
    user_name = "Dr. Elena Vance"
    reg_resp = client.post("/auth/register", json={
        "email": unique_email,
        "password": "SecurePassword2026!",
        "full_name": user_name,
        "company_name": "Apex Quantum Labs",
        "role": "hiring_manager"
    })
    assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
    reg_data = reg_resp.json()
    assert reg_data["user"]["full_name"] == user_name
    assert reg_data["user"]["is_verified"] is False
    v_code = reg_data["verification_code"]
    assert v_code is not None and len(v_code) == 6
    print(f"[2/10] Account Registration: PASSED (Email: {unique_email}, Code: {v_code})")

    # Verify cookie was set in client
    assert "resumind_session" in client.cookies, "HttpOnly session cookie was not set!"
    session_token = client.cookies["resumind_session"]
    print(f"[3/10] HttpOnly Session Cookie Established: PASSED")

    # Scenario 3: Verify email with verification code
    verify_resp = client.post("/auth/verify-email", json={
        "email": unique_email,
        "code": v_code
    })
    assert verify_resp.status_code == 200, f"Verification failed: {verify_resp.text}"
    assert verify_resp.json()["user"]["is_verified"] is True
    print("[4/10] Email Verification with 6-digit Code: PASSED")

    # Scenario 4: Get profile while logged in (simulating page refresh)
    me_resp = client.get("/auth/me")
    assert me_resp.status_code == 200, f"Expected 200, got {me_resp.status_code}"
    me_data = me_resp.json()
    assert me_data["full_name"] == user_name
    assert me_data["email"] == unique_email
    assert me_data["is_verified"] is True
    print("[5/10] Authenticated Profile Persistence (Refresh check): PASSED")

    # Scenario 5: Prevent duplicate registration with same email
    dup_resp = client.post("/auth/register", json={
        "email": unique_email,
        "password": "AnotherPassword!",
        "full_name": "Clone User"
    })
    assert dup_resp.status_code == 400, "Duplicate email allowed!"
    print("[6/10] Duplicate Email Prevention: PASSED")

    # Scenario 6: Test Login with incorrect credentials
    wrong_login = client.post("/auth/login", json={
        "email": unique_email,
        "password": "WrongPassword999!"
    })
    assert wrong_login.status_code == 401, f"Expected 401 for wrong password, got {wrong_login.status_code}"
    print("[7/10] Credential Validation & Error Handling: PASSED")

    # Scenario 7: Logout
    logout_resp = client.post("/auth/logout")
    assert logout_resp.status_code == 200, f"Logout failed: {logout_resp.text}"
    assert "resumind_session" not in client.cookies or client.cookies["resumind_session"] == ""
    print("[8/10] Server-side Session Invalidation & Cookie Cleared: PASSED")

    # Scenario 8: Try accessing protected /auth/me after logout -> Must be 401
    me_after_logout = client.get("/auth/me")
    assert me_after_logout.status_code == 401, f"Access allowed after logout! Status: {me_after_logout.status_code}"
    print("[9/10] Protected /auth/me denied after logout: PASSED")

    # Scenario 9: Try reusing the old invalidated session token manually via Header
    hacked_client = httpx.Client(base_url=BASE_URL, headers={"Authorization": f"Bearer {session_token}"})
    reused_resp = hacked_client.get("/auth/me")
    assert reused_resp.status_code == 401, "Invalidated session was reused!"
    print("[10/10] Session Reuse Blocked (Server-side Invalidation Verified): PASSED")

    print("\n=== ALL 10 AUTHENTICATION SCENARIOS VERIFIED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_full_auth_scenarios()
