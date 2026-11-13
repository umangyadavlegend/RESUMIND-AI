import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, hash_password
from app.models.user import User
from app.models.session import UserSession
from app.schemas.user import (
    UserRegisterRequest,
    VerifyRegistrationOtpRequest,
    LoginStep1Request,
    VerifyLoginOtpRequest,
    ResendOtpRequest,
    ForgotPasswordRequest,
    VerifyResetOtpRequest,
    ResetPasswordRequest,
    UserOut,
    AuthResponse,
    LoginStep1Response,
    GenericResponse
)
from app.services.otp_service import (
    generate_and_store_otp,
    verify_and_consume_otp,
    OTPCooldownError,
    OTPValidationError,
    _hash_otp
)
from app.services.email_service import (
    send_registration_otp_email,
    send_login_otp_email,
    send_password_reset_otp_email,
    SMTPNotConfiguredError,
    EmailDeliveryError
)
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

SESSION_DURATION_DAYS = 7
COOKIE_NAME = "resumind_session"

def _create_server_session(user_id: int, request: Request, db: Session) -> UserSession:
    """Generate a cryptographically secure session token and persist to database."""
    session_token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    
    user_agent = request.headers.get("User-Agent", "")[:500] if request else None
    client_ip = request.client.host if (request and request.client) else None

    db_session = UserSession(
        user_id=user_id,
        session_token=session_token,
        is_active=True,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=client_ip
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def _set_session_cookie(response: Response, session_token: str):
    """Set secure HttpOnly cookie on response."""
    max_age_seconds = SESSION_DURATION_DAYS * 24 * 60 * 60
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_token,
        max_age=max_age_seconds,
        expires=max_age_seconds,
        httponly=True,
        samesite="lax",
        secure=False,  # False for local HTTP development, True in HTTPS production
        path="/"
    )

def _clear_session_cookie(response: Response):
    """Securely clear the session cookie."""
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        samesite="lax",
        path="/"
    )

# =========================================================================
# 1. POST /api/auth/register
# =========================================================================
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    user_in: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Real User Registration:
    - Validates fields and password match
    - Verifies email uniqueness
    - Securely hashes password
    - Generates 6-digit cryptographically secure OTP
    - Dispatches OTP to registered email via SMTP
    - Unverified user cannot access protected features
    """
    clean_email = user_in.email.lower().strip()
    clean_name = user_in.full_name.strip()

    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full real name is required."
        )

    if user_in.password != user_in.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match. Please verify and re-enter."
        )

    # Check for existing user
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        if existing_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A registered account already exists with this email address. Please sign in."
            )
        else:
            # Update unverified user details and re-issue OTP
            existing_user.hashed_password = hash_password(user_in.password)
            existing_user.full_name = clean_name
            existing_user.phone_number = user_in.phone_number.strip() if user_in.phone_number else ""
            existing_user.company_name = user_in.company_name.strip() if user_in.company_name else ""
            db.commit()
            db.refresh(existing_user)
            target_user = existing_user
    else:
        target_user = User(
            email=clean_email,
            hashed_password=hash_password(user_in.password),
            full_name=clean_name,
            phone_number=user_in.phone_number.strip() if user_in.phone_number else "",
            company_name=user_in.company_name.strip() if user_in.company_name else "",
            role="recruiter",
            is_active=True,
            is_verified=False
        )
        db.add(target_user)
        db.commit()
        db.refresh(target_user)

    # Generate 6-digit OTP (stored hashed)
    try:
        raw_otp = generate_and_store_otp(
            db=db,
            email=clean_email,
            purpose="registration",
            user_id=target_user.id
        )
    except OTPCooldownError as err:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(err))

    # Send verification email via SMTP
    try:
        send_registration_otp_email(
            to_email=clean_email,
            full_name=target_user.full_name,
            otp_code=raw_otp
        )
    except (SMTPNotConfiguredError, EmailDeliveryError) as email_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Email delivery error: {str(email_err)}"
        )

    return {
        "status": "otp_required",
        "message": "Account created. A 6-digit verification code has been dispatched to your email address.",
        "email": clean_email
    }

# =========================================================================
# 2. POST /api/auth/verify-registration-otp
# =========================================================================
@router.post("/verify-registration-otp")
def verify_registration_otp(
    verify_in: VerifyRegistrationOtpRequest,
    db: Session = Depends(get_db)
):
    """
    Validate Registration OTP:
    - Verifies 6-digit OTP against database hash
    - Enforces 5-minute expiry and max 5 attempts
    - Activates account and marks email as verified
    """
    clean_email = verify_in.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if user.is_verified:
        return {
            "status": "already_verified",
            "message": "Account is already verified. Please proceed to sign in."
        }

    try:
        verify_and_consume_otp(
            db=db,
            email=clean_email,
            purpose="registration",
            raw_code=verify_in.otp
        )
    except OTPValidationError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

    user.is_verified = True
    user.is_active = True
    db.commit()
    db.refresh(user)

    return {
        "status": "verified",
        "message": "Email verified successfully! You may now sign in with your credentials.",
        "user": UserOut.model_validate(user)
    }

# Legacy alias
@router.post("/verify-email")
def verify_email_alias(verify_in: VerifyRegistrationOtpRequest, db: Session = Depends(get_db)):
    return verify_registration_otp(verify_in, db)

# =========================================================================
# 3. POST /api/auth/login (Step 1: Password Check -> OTP Dispatch)
# =========================================================================
@router.post("/login", response_model=LoginStep1Response)
def login_step_one(
    login_in: LoginStep1Request,
    db: Session = Depends(get_db)
):
    """
    Step 1 of Two-Factor Login:
    - Validates email and password
    - Verifies user is active and email is verified
    - Generates 6-digit login OTP and dispatches to email
    - Strictly does NOT create session or cookie until OTP is confirmed in Step 2!
    """
    clean_email = login_in.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify your credentials."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact an administrator."
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address not verified. Please complete account verification before signing in."
        )

    # Generate 6-digit login OTP
    try:
        raw_otp = generate_and_store_otp(
            db=db,
            email=clean_email,
            purpose="login",
            user_id=user.id
        )
    except OTPCooldownError as err:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(err))

    # Send login OTP via email
    try:
        send_login_otp_email(
            to_email=clean_email,
            full_name=user.full_name,
            otp_code=raw_otp
        )
    except (SMTPNotConfiguredError, EmailDeliveryError) as email_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Email delivery error: {str(email_err)}"
        )

    return LoginStep1Response(
        status="otp_required",
        message="Credentials verified. A 6-digit authentication code has been dispatched to your registered email.",
        email=clean_email
    )

# =========================================================================
# 4. POST /api/auth/verify-login-otp (Step 2: OTP Check -> Session Creation)
# =========================================================================
@router.post("/verify-login-otp", response_model=AuthResponse)
def verify_login_otp(
    verify_in: VerifyLoginOtpRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Step 2 of Two-Factor Login:
    - Validates login OTP code against hashed DB record
    - Only on success: establishes server-side session and attaches HttpOnly cookie
    - Returns authenticated user details
    """
    clean_email = verify_in.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    if not user.is_active or not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    try:
        verify_and_consume_otp(
            db=db,
            email=clean_email,
            purpose="login",
            raw_code=verify_in.otp
        )
    except OTPValidationError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

    # Create server session and attach HttpOnly cookie
    db_session = _create_server_session(user.id, request, db)
    _set_session_cookie(response, db_session.session_token)

    return AuthResponse(
        user=UserOut.model_validate(user),
        message="Two-factor authentication successful. Welcome back!",
        status="success",
        access_token=db_session.session_token
    )

# =========================================================================
# 5. POST /api/auth/resend-otp
# =========================================================================
@router.post("/resend-otp", response_model=GenericResponse)
def resend_otp(
    data: ResendOtpRequest,
    db: Session = Depends(get_db)
):
    """
    Resend verification OTP:
    - Enforces 60-second cooldown
    - Invalidates previous OTP
    - Dispatches newly generated OTP to registered email
    """
    clean_email = data.email.lower().strip()
    purpose = data.purpose.lower().strip()

    if purpose not in ("registration", "login", "reset"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP purpose specified.")

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        # Avoid account enumeration for reset/login
        if purpose in ("login", "reset"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")
        recipient_name = "Recruiter"
        user_id = None
    else:
        recipient_name = user.full_name
        user_id = user.id

    try:
        raw_otp = generate_and_store_otp(
            db=db,
            email=clean_email,
            purpose=purpose,
            user_id=user_id
        )
    except OTPCooldownError as err:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(err))

    # Dispatch email
    try:
        if purpose == "registration":
            send_registration_otp_email(clean_email, recipient_name, raw_otp)
        elif purpose == "login":
            send_login_otp_email(clean_email, recipient_name, raw_otp)
        elif purpose == "reset":
            send_password_reset_otp_email(clean_email, recipient_name, raw_otp)
    except (SMTPNotConfiguredError, EmailDeliveryError) as email_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Email delivery error: {str(email_err)}"
        )

    return GenericResponse(
        status="success",
        message="A new 6-digit verification code has been dispatched to your email."
    )

# Legacy alias
@router.post("/resend-verification")
def resend_verification_alias(data: ResendOtpRequest, db: Session = Depends(get_db)):
    return resend_otp(data, db)

# =========================================================================
# 6. POST /api/auth/logout
# =========================================================================
@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Invalidates active session in database and clears HttpOnly session cookie.
    Subsequent API calls will be rejected with 401 Unauthorized.
    """
    token = None
    if request.cookies and COOKIE_NAME in request.cookies:
        token = request.cookies.get(COOKIE_NAME)
    elif request.headers.get("Authorization"):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if token:
        db_session = db.query(UserSession).filter(UserSession.session_token == token).first()
        if db_session:
            db_session.is_active = False
            db.commit()

    _clear_session_cookie(response)
    return {
        "status": "logged_out",
        "message": "Successfully signed out. Active session has been invalidated."
    }

# =========================================================================
# 7. GET /api/auth/me
# =========================================================================
@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve authenticated user profile.
    Returns 401 Unauthorized if no active valid session exists.
    """
    return UserOut.model_validate(current_user)

# =========================================================================
# 8. POST /api/auth/forgot-password
# =========================================================================
@router.post("/forgot-password", response_model=GenericResponse)
def forgot_password(
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Initiates password reset:
    - Generates 6-digit password reset OTP
    - Dispatches to registered email
    """
    clean_email = data.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        # Generic response to prevent email harvesting
        return GenericResponse(
            status="success",
            message="If an account exists with this email address, a password reset code has been dispatched."
        )

    try:
        raw_otp = generate_and_store_otp(
            db=db,
            email=clean_email,
            purpose="reset",
            user_id=user.id
        )
    except OTPCooldownError as err:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(err))

    try:
        send_password_reset_otp_email(
            to_email=clean_email,
            full_name=user.full_name,
            otp_code=raw_otp
        )
    except (SMTPNotConfiguredError, EmailDeliveryError) as email_err:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Email delivery error: {str(email_err)}"
        )

    return GenericResponse(
        status="success",
        message="If an account exists with this email address, a password reset code has been dispatched."
    )

# =========================================================================
# 9. POST /api/auth/verify-reset-otp
# =========================================================================
@router.post("/verify-reset-otp", response_model=GenericResponse)
def verify_reset_otp(
    data: VerifyResetOtpRequest,
    db: Session = Depends(get_db)
):
    """
    Validate that a supplied password reset OTP is authentic and unexpired
    before rendering the new password entry form.
    """
    clean_email = data.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    from app.models.otp import OtpVerification
    import hmac

    now_utc = datetime.now(timezone.utc)
    otp_record = db.query(OtpVerification).filter(
        OtpVerification.email == clean_email,
        OtpVerification.purpose == "reset",
        OtpVerification.is_used == False
    ).order_by(OtpVerification.created_at.desc()).first()

    if not otp_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active reset code found.")

    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now_utc > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset code has expired.")

    if otp_record.attempts >= otp_record.max_attempts:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum attempts exceeded.")

    submitted_hash = _hash_otp(data.otp.strip())
    if not hmac.compare_digest(submitted_hash, otp_record.otp_hash):
        otp_record.attempts += 1
        db.commit()
        remaining = max(0, otp_record.max_attempts - otp_record.attempts)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid reset code. {remaining} attempt(s) remaining.")

    return GenericResponse(status="success", message="Verification code confirmed. You may now specify a new password.")

# =========================================================================
# 10. POST /api/auth/reset-password
# =========================================================================
@router.post("/reset-password", response_model=GenericResponse)
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Consumes the reset OTP, updates the user's password, and invalidates all existing sessions.
    """
    clean_email = data.email.lower().strip()

    if data.new_password != data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match."
        )

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

    try:
        verify_and_consume_otp(
            db=db,
            email=clean_email,
            purpose="reset",
            raw_code=data.otp
        )
    except OTPValidationError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))

    # Update password
    user.hashed_password = hash_password(data.new_password)

    # Invalidate all existing sessions for this user for security
    db.query(UserSession).filter(UserSession.user_id == user.id).update(
        {"is_active": False},
        synchronize_session=False
    )
    db.commit()

    return GenericResponse(
        status="success",
        message="Password successfully reset. You may now sign in with your new password."
    )

# =========================================================================
# 11. GET /api/auth/dev-mailbox (Development Mailbox Preview)
# =========================================================================
@router.get("/dev-mailbox")
def get_dev_mailbox_route(
    email: Optional[str] = None
):
    """
    Development mailbox helper returning recently dispatched OTP emails.
    Enables local testing without requiring external SMTP accounts.
    """
    from app.services.email_service import get_dev_mailbox
    emails = get_dev_mailbox(email)
    return {
        "status": "success",
        "count": len(emails),
        "emails": emails
    }
