import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.otp import OtpVerification

class OTPError(Exception):
    """Base exception for OTP operations."""
    pass

class OTPCooldownError(OTPError):
    """Raised when OTP generation is requested before the cooldown period has elapsed."""
    def __init__(self, remaining_seconds: int):
        self.remaining_seconds = remaining_seconds
        super().__init__(f"Please wait {remaining_seconds} seconds before requesting a new verification code.")

class OTPValidationError(OTPError):
    """Raised when OTP verification fails due to expiration, mismatch, or attempt exhaustion."""
    pass

def _hash_otp(otp_code: str) -> str:
    """Hash raw 6-digit OTP combined with server secret key using SHA-256."""
    salted = f"{otp_code.strip()}:{settings.SECRET_KEY}".encode("utf-8")
    return hashlib.sha256(salted).hexdigest()

def generate_and_store_otp(
    db: Session,
    email: str,
    purpose: str,
    user_id: Optional[int] = None
) -> str:
    """
    Generate a cryptographically secure 6-digit OTP, invalidate any prior active
    codes for this email & purpose, enforce the 60-second resend cooldown,
    and persist the securely hashed OTP.
    Returns the raw 6-digit string so it can be dispatched via email.
    """
    clean_email = email.lower().strip()
    now_utc = datetime.now(timezone.utc)

    # 1. Check for 60-second resend cooldown on recent OTP
    recent_otp = db.query(OtpVerification).filter(
        OtpVerification.email == clean_email,
        OtpVerification.purpose == purpose
    ).order_by(OtpVerification.created_at.desc()).first()

    if recent_otp:
        created_time = recent_otp.created_at
        if created_time.tzinfo is None:
            created_time = created_time.replace(tzinfo=timezone.utc)
        elapsed = (now_utc - created_time).total_seconds()
        if elapsed < settings.OTP_COOLDOWN_SECONDS:
            remaining = int(settings.OTP_COOLDOWN_SECONDS - elapsed)
            raise OTPCooldownError(remaining_seconds=remaining)

    # 2. Invalidate all previous unexpired/unused OTPs for this (email, purpose)
    db.query(OtpVerification).filter(
        OtpVerification.email == clean_email,
        OtpVerification.purpose == purpose,
        OtpVerification.is_used == False
    ).update({"is_used": True}, synchronize_session="fetch")
    db.commit()
    db.expire_all()

    # 3. Cryptographically secure 6-digit OTP generation
    # secrets.randbelow(900000) generates an integer from 0 to 899999; + 100000 yields [100000, 999999]
    raw_otp = f"{secrets.randbelow(900000) + 100000}"
    hashed_otp = _hash_otp(raw_otp)
    expires_at = now_utc + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    otp_record = OtpVerification(
        user_id=user_id,
        email=clean_email,
        otp_hash=hashed_otp,
        purpose=purpose,
        attempts=0,
        max_attempts=settings.OTP_MAX_ATTEMPTS,
        is_used=False,
        expires_at=expires_at,
        created_at=now_utc
    )
    db.add(otp_record)
    db.commit()
    db.refresh(otp_record)

    return raw_otp

def verify_and_consume_otp(
    db: Session,
    email: str,
    purpose: str,
    raw_code: str
) -> bool:
    """
    Validate the supplied OTP code against the hashed record in the database.
    Enforces expiration, single-use, and a maximum of 5 failed attempts.
    Consumes (invalidates) the OTP upon successful verification.
    """
    clean_email = email.lower().strip()
    code_str = str(raw_code).strip()
    now_utc = datetime.now(timezone.utc)

    # Find the most recent active OTP record for this email and purpose
    otp_record = db.query(OtpVerification).filter(
        OtpVerification.email == clean_email,
        OtpVerification.purpose == purpose,
        OtpVerification.is_used == False
    ).order_by(OtpVerification.created_at.desc()).first()

    if not otp_record:
        raise OTPValidationError("No active verification code found for this request. Please request a new code.")

    # Check expiration
    expires_at = otp_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now_utc > expires_at:
        otp_record.is_used = True
        db.commit()
        raise OTPValidationError("Verification code has expired. Please request a new code.")

    # Check maximum attempt threshold
    if otp_record.attempts >= otp_record.max_attempts:
        otp_record.is_used = True
        db.commit()
        raise OTPValidationError("Maximum verification attempts exceeded. Please request a new code.")

    # Constant-time comparison of hashed OTP
    expected_hash = otp_record.otp_hash
    submitted_hash = _hash_otp(code_str)

    if not hmac.compare_digest(submitted_hash, expected_hash):
        otp_record.attempts += 1
        if otp_record.attempts >= otp_record.max_attempts:
            otp_record.is_used = True
        db.commit()
        remaining = max(0, otp_record.max_attempts - otp_record.attempts)
        if remaining == 0:
            raise OTPValidationError("Maximum verification attempts exceeded. Please request a new code.")
        raise OTPValidationError(f"Invalid verification code. {remaining} attempt(s) remaining.")

    # Mark as used (single use)
    otp_record.is_used = True
    db.commit()
    return True
