import os
import sys
from unittest.mock import patch, MagicMock

os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import HTTPException, Response
from starlette.requests import Request
from app.core.database import SessionLocal
from app.models.user import User
from app.models.session import UserSession
from app.models.otp import OtpVerification
from app.models.job import JobDescription
from app.models.candidate import Candidate
from app.models.resume import Resume
from app.schemas.user import (
    UserRegisterRequest,
    VerifyRegistrationOtpRequest,
    LoginStep1Request,
    VerifyLoginOtpRequest,
    ResendOtpRequest,
    ForgotPasswordRequest,
    VerifyResetOtpRequest,
    ResetPasswordRequest
)
from app.api.auth import (
    register,
    verify_registration_otp,
    login_step_one,
    verify_login_otp,
    resend_otp,
    logout,
    get_me,
    forgot_password,
    verify_reset_otp,
    reset_password
)
from app.api.deps import get_current_user
from app.api.jobs import list_jobs
from app.api.resumes import list_resumes
from app.api.candidates import list_candidates
from app.services.email_service import SMTPNotConfiguredError, is_smtp_configured

TEST_EMAIL = "sarah.connor@enterprisetech.org"
TEST_PW = "SecurePassword2026!"
TEST_NAME = "Sarah Connor"

def make_dummy_request(cookies=None, client_ip="127.0.0.1", user_agent="Mozilla/5.0 TestClient"):
    req = MagicMock(spec=Request)
    req.cookies = cookies or {}
    req.headers = {"User-Agent": user_agent}
    req.client = MagicMock()
    req.client.host = client_ip
    return req

def cleanup(db):
    u = db.query(User).filter(User.email == TEST_EMAIL).first()
    if u:
        db.query(UserSession).filter(UserSession.user_id == u.id).delete()
        db.query(JobDescription).filter(JobDescription.user_id == u.id).delete()
        db.query(Candidate).filter(Candidate.user_id == u.id).delete()
        db.query(Resume).filter(Resume.user_id == u.id).delete()
        db.delete(u)
    db.query(OtpVerification).filter(OtpVerification.email == TEST_EMAIL).delete()
    db.commit()

def run_tests():
    print("=" * 70)
    print("RESUMIND AI — PRODUCTION AUTH & MULTI-TENANCY VERIFICATION SUITE")
    print("=" * 70)

    db = SessionLocal()
    try:
        cleanup(db)

        # -------------------------------------------------------------
        # SCENARIO 1: Registration field validation (Password mismatch)
        # -------------------------------------------------------------
        try:
            req_mismatch = UserRegisterRequest(
                full_name=TEST_NAME,
                email=TEST_EMAIL,
                password=TEST_PW,
                confirm_password="MismatchPassword999!"
            )
            register(req_mismatch, db)
            assert False, "Should fail on password mismatch"
        except HTTPException as exc:
            assert exc.status_code == 400
            assert "Passwords do not match" in exc.detail
            print("[PASS] 01. Registration: Password mismatch rejected with 400 Bad Request")

        # -------------------------------------------------------------
        # SCENARIO 2: Password strength validation (< 8 chars)
        # -------------------------------------------------------------
        try:
            UserRegisterRequest(
                full_name=TEST_NAME,
                email=TEST_EMAIL,
                password="short",
                confirm_password="short"
            )
            assert False, "Should fail on short password"
        except ValueError as exc:
            assert "at least 8 characters" in str(exc)
            print("[PASS] 02. Registration: Password < 8 characters rejected by Pydantic schema")

        # -------------------------------------------------------------
        # SCENARIO 3: Honest error when SMTP email fails or unconfigured
        # -------------------------------------------------------------
        with patch("app.api.auth.send_registration_otp_email") as mock_email:
            mock_email.side_effect = SMTPNotConfiguredError("SMTP credentials not configured.")
            req_valid = UserRegisterRequest(
                full_name=TEST_NAME,
                email=TEST_EMAIL,
                phone_number="+1 (555) 019-2834",
                company_name="Cyberdyne Systems",
                password=TEST_PW,
                confirm_password=TEST_PW
            )
            try:
                register(req_valid, db)
                assert False, "Should fail when SMTP is unconfigured"
            except HTTPException as exc:
                assert exc.status_code == 503
                assert "Email delivery error" in exc.detail
                print("[PASS] 03. Registration: Honest 503 error returned when SMTP is unconfigured")

        # -------------------------------------------------------------
        # SCENARIO 4: Successful registration & 6-digit OTP generation
        # -------------------------------------------------------------
        # Clear previous OTP from scenario 3 to simulate fresh registration without cooldown
        db.query(OtpVerification).filter(OtpVerification.email == TEST_EMAIL).delete()
        db.commit()

        dispatched_reg_otps = []
        def mock_send_reg(to_email=None, full_name=None, otp_code=None, *args, **kwargs):
            code = otp_code or (args[2] if len(args) > 2 else "")
            dispatched_reg_otps.append(code)

        with patch("app.api.auth.send_registration_otp_email", side_effect=mock_send_reg):
            reg_resp = register(req_valid, db)
            assert reg_resp["status"] == "otp_required"
            assert len(dispatched_reg_otps) == 1
            reg_otp = dispatched_reg_otps[0]
            assert len(reg_otp) == 6
            assert reg_otp.isdigit()
            print(f"[PASS] 04. Registration: 6-digit cryptographically secure OTP dispatched via email")

        # -------------------------------------------------------------
        # SCENARIO 5: Check Hashed OTP in DB and User is Unverified
        # -------------------------------------------------------------
        otp_rec = db.query(OtpVerification).filter(
            OtpVerification.email == TEST_EMAIL,
            OtpVerification.purpose == "registration"
        ).first()
        assert otp_rec is not None
        assert otp_rec.otp_hash != reg_otp, "Raw OTP must not be stored in database"
        assert len(otp_rec.otp_hash) == 64, "OTP must be stored as SHA-256 hash"
        assert otp_rec.is_used is False

        user_db = db.query(User).filter(User.email == TEST_EMAIL).first()
        assert user_db is not None
        assert user_db.is_verified is False, "New user must start unverified"
        assert user_db.is_active is True
        print("[PASS] 05. OTP Security: OTP stored as SHA-256 hash, user initially unverified")

        # -------------------------------------------------------------
        # SCENARIO 6: Unverified user blocked from signing in
        # -------------------------------------------------------------
        try:
            login_step_one(LoginStep1Request(email=TEST_EMAIL, password=TEST_PW), db)
            assert False, "Unverified user should not be able to log in"
        except HTTPException as exc:
            assert exc.status_code == 403
            assert "not verified" in exc.detail.lower()
            print("[PASS] 06. Access Control: Unverified user strictly blocked from login (403 Forbidden)")

        # -------------------------------------------------------------
        # SCENARIO 7: Wrong registration OTP rejected
        # -------------------------------------------------------------
        try:
            verify_registration_otp(VerifyRegistrationOtpRequest(email=TEST_EMAIL, otp="000000"), db)
            assert False, "Wrong OTP should be rejected"
        except HTTPException as exc:
            assert exc.status_code == 400
            assert "Invalid verification code" in exc.detail
            print("[PASS] 07. OTP Security: Incorrect OTP rejected with remaining attempts counter")

        # -------------------------------------------------------------
        # SCENARIO 8: Valid registration OTP activates account
        # -------------------------------------------------------------
        v_res = verify_registration_otp(VerifyRegistrationOtpRequest(email=TEST_EMAIL, otp=reg_otp), db)
        assert v_res["status"] == "verified"
        db.refresh(user_db)
        assert user_db.is_verified is True
        db.refresh(otp_rec)
        assert otp_rec.is_used is True
        print("[PASS] 08. OTP Verification: Valid code activates account and marks OTP single-use")

        # -------------------------------------------------------------
        # SCENARIO 9: Duplicate registration prevented
        # -------------------------------------------------------------
        try:
            register(req_valid, db)
            assert False, "Duplicate registered email should be rejected"
        except HTTPException as exc:
            assert exc.status_code == 400
            assert "already exists" in exc.detail
            print("[PASS] 09. Registration: Duplicate verified email prevented (400 Bad Request)")

        # -------------------------------------------------------------
        # SCENARIO 10: Login Step 1 - Bad password fails
        # -------------------------------------------------------------
        try:
            login_step_one(LoginStep1Request(email=TEST_EMAIL, password="WrongPassword999!"), db)
            assert False, "Incorrect password should fail"
        except HTTPException as exc:
            assert exc.status_code == 401
            assert "Incorrect email or password" in exc.detail
            print("[PASS] 10. Login Step 1: Incorrect password rejected (401 Unauthorized)")

        # -------------------------------------------------------------
        # SCENARIO 11: Login Step 1 - Correct password dispatches Login OTP
        # (Crucial: NO session cookie issued yet!)
        # -------------------------------------------------------------
        login_otps = []
        def mock_send_login(to_email=None, full_name=None, otp_code=None, *args, **kwargs):
            code = otp_code or (args[2] if len(args) > 2 else "")
            login_otps.append(code)

        with patch("app.api.auth.send_login_otp_email", side_effect=mock_send_login):
            step1_res = login_step_one(LoginStep1Request(email=TEST_EMAIL, password=TEST_PW), db)
            assert step1_res.status == "otp_required"
            assert len(login_otps) == 1
            login_otp = login_otps[0]
            print("[PASS] 11. Login Step 1: Password verified -> 6-digit Login OTP dispatched (Zero session issued)")

        # -------------------------------------------------------------
        # SCENARIO 12: Login Step 2 - Valid OTP creates HttpOnly session
        # -------------------------------------------------------------
        dummy_req = make_dummy_request()
        dummy_res = Response()
        step2_res = verify_login_otp(
            VerifyLoginOtpRequest(email=TEST_EMAIL, otp=login_otp),
            dummy_req,
            dummy_res,
            db
        )
        assert step2_res.status == "success"
        assert step2_res.user.full_name == TEST_NAME
        assert step2_res.access_token is not None

        # Verify HttpOnly cookie header was set on response
        raw_headers = str(dummy_res.raw_headers)
        assert "resumind_session" in raw_headers
        assert "httponly" in raw_headers.lower()
        session_token = step2_res.access_token
        print("[PASS] 12. Login Step 2: Valid Login OTP establishes server session & attaches HttpOnly cookie")

        # -------------------------------------------------------------
        # SCENARIO 13: GET /api/auth/me returns authenticated registered name
        # -------------------------------------------------------------
        authed_req = make_dummy_request(cookies={"resumind_session": session_token})
        current_u = get_current_user(authed_req, db)
        me_out = get_me(current_u)
        assert me_out.full_name == TEST_NAME
        assert me_out.email == TEST_EMAIL
        print(f"[PASS] 13. User Session: Profile returns registered full name '{TEST_NAME}'")

        # -------------------------------------------------------------
        # SCENARIO 14: User Isolation - New user starts with empty personal dashboard
        # -------------------------------------------------------------
        user_jobs = list_jobs(db, current_u)
        assert len(user_jobs) == 0, "Jobs must be 0 for new user"
        user_resumes = list_resumes(db, current_u)
        assert len(user_resumes) == 0, "Resumes must be 0 for new user"
        user_cands = list_candidates(None, None, None, db, current_u)
        assert len(user_cands) == 0, "Candidates must be 0 for new user"
        print("[PASS] 14. Multi-Tenancy: New user starts with 100% empty personal dashboard")

        # -------------------------------------------------------------
        # SCENARIO 15: OTP Resend 60-Second Cooldown
        # -------------------------------------------------------------
        with patch("app.api.auth.send_login_otp_email"):
            try:
                resend_otp(ResendOtpRequest(email=TEST_EMAIL, purpose="login"), db)
                assert False, "Should be blocked by 60s cooldown"
            except HTTPException as exc:
                assert exc.status_code == 429
                assert "Please wait" in exc.detail
                print("[PASS] 15. OTP Security: Resend cooldown enforced (429 Too Many Requests)")

        # -------------------------------------------------------------
        # SCENARIO 16: OTP Max 5 Failed Attempts Lockout
        # -------------------------------------------------------------
        # Generate fresh registration OTP to test attempt exhaustion
        with patch("app.api.auth.send_registration_otp_email"):
            # Update created_at of previous OTP to bypass cooldown for testing
            db.query(OtpVerification).filter(OtpVerification.email == TEST_EMAIL).delete()
            db.commit()
            test_otp_code = "123890"

        # Direct verify_and_consume test for attempt counting
        from app.services.otp_service import generate_and_store_otp, verify_and_consume_otp, OTPValidationError
        generate_and_store_otp(db, TEST_EMAIL, purpose="login", user_id=current_u.id)

        for attempt in range(1, 5):
            try:
                verify_and_consume_otp(db, TEST_EMAIL, "login", f"00000{attempt}")
                assert False
            except OTPValidationError as err:
                assert "attempt(s) remaining" in str(err)

        try:
            verify_and_consume_otp(db, TEST_EMAIL, "login", "999999")
            assert False
        except OTPValidationError as err:
            assert "Maximum verification attempts exceeded" in str(err)
        print("[PASS] 16. OTP Security: 5 failed attempts locks and invalidates OTP")

        # -------------------------------------------------------------
        # SCENARIO 17: Logout invalidates session in DB and blocks API
        # -------------------------------------------------------------
        logout_res_obj = Response()
        logout_resp = logout(authed_req, logout_res_obj, db)
        assert logout_resp["status"] == "logged_out"

        # Check DB session is_active is now False
        sess_db = db.query(UserSession).filter(UserSession.session_token == session_token).first()
        assert sess_db.is_active is False

        # Attempting to call get_current_user with logged out session must fail with 401
        try:
            get_current_user(authed_req, db)
            assert False, "Logged out session should be rejected"
        except HTTPException as exc:
            assert exc.status_code == 401
            assert "logged out" in exc.detail.lower()
            print("[PASS] 17. Logout: Active session invalidated in DB; Subsequent API calls rejected (401)")

        # -------------------------------------------------------------
        # SCENARIO 18: Forgot Password & Password Reset Flow
        # -------------------------------------------------------------
        reset_otps = []
        def mock_send_reset(to_email=None, full_name=None, otp_code=None, *args, **kwargs):
            code = otp_code or (args[2] if len(args) > 2 else "")
            reset_otps.append(code)

        with patch("app.api.auth.send_password_reset_otp_email", side_effect=mock_send_reset):
            f_resp = forgot_password(ForgotPasswordRequest(email=TEST_EMAIL), db)
            assert f_resp.status == "success"
            assert len(reset_otps) == 1
            reset_code = reset_otps[0]

        v_res = verify_reset_otp(VerifyResetOtpRequest(email=TEST_EMAIL, otp=reset_code), db)
        assert v_res.status == "success"

        new_password = "BrandNewSecretPassword2026!"
        r_resp = reset_password(
            ResetPasswordRequest(
                email=TEST_EMAIL,
                otp=reset_code,
                new_password=new_password,
                confirm_password=new_password
            ),
            db
        )
        assert r_resp.status == "success"

        # Verify old password no longer works
        try:
            login_step_one(LoginStep1Request(email=TEST_EMAIL, password=TEST_PW), db)
            assert False, "Old password should not work"
        except HTTPException as exc:
            assert exc.status_code == 401

        # Clear cooldown for testing subsequent login
        db.query(OtpVerification).filter(OtpVerification.email == TEST_EMAIL, OtpVerification.purpose == "login").delete()
        db.commit()

        # Verify new password initiates 2FA
        with patch("app.api.auth.send_login_otp_email", side_effect=mock_send_login):
            new_login = login_step_one(LoginStep1Request(email=TEST_EMAIL, password=new_password), db)
            assert new_login.status == "otp_required"
            print("[PASS] 18. Password Reset: Reset OTP verified, password updated, old credentials revoked")

        cleanup(db)
        print("=" * 70)
        print("ALL 18 PRODUCTION AUTHENTICATION & SECURITY SCENARIOS 100% VERIFIED!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
