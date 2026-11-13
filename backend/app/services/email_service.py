import smtplib
from email.message import EmailMessage
from datetime import datetime, timezone
import logging
from typing import Optional, List, Dict, Any
from app.core.config import settings

logger = logging.getLogger("resumind_ai.email")

class EmailDeliveryError(Exception):
    """Raised when an email cannot be delivered."""
    pass

class SMTPNotConfiguredError(EmailDeliveryError):
    """Raised when SMTP credentials are not configured in the server environment."""
    pass

# In-memory development mailbox storing the most recent dispatched emails
DEV_MAILBOX: List[Dict[str, Any]] = []

def get_dev_mailbox(email: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve captured development emails, optionally filtered by recipient."""
    if email:
        clean = email.strip().lower()
        return [m for m in reversed(DEV_MAILBOX) if m["to_email"].lower() == clean]
    return list(reversed(DEV_MAILBOX))

def clear_dev_mailbox() -> None:
    DEV_MAILBOX.clear()

def is_smtp_configured() -> bool:
    """Check if mandatory SMTP configuration variables are set."""
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)

def _send_smtp_email(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: str,
    otp_code: Optional[str] = None
) -> None:
    """
    Deliver an email via SMTP or capture into Dev Mailbox if SMTP is unconfigured.
    Supports STARTTLS, direct SSL, authentication, and custom ports.
    """
    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. If SMTP is configured, attempt real delivery
    if is_smtp_configured():
        msg = EmailMessage()
        msg["Subject"] = subject
        from_name = settings.SMTP_FROM_NAME or "RESUMIND AI"
        msg["From"] = f"{from_name} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.set_content(text_content)
        msg.add_alternative(html_content, subtype="html")

        try:
            if settings.SMTP_USE_SSL or settings.SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
                if settings.SMTP_USE_TLS:
                    server.starttls()

            if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

            server.send_message(msg)
            server.quit()
            logger.info(f"Verification email successfully dispatched via SMTP to {to_email}")

            # Also keep record in dev mailbox for local inspection
            DEV_MAILBOX.append({
                "to_email": to_email,
                "subject": subject,
                "text_content": text_content,
                "html_content": html_content,
                "otp_code": otp_code,
                "dispatched_at": now_iso,
                "mode": "smtp_live"
            })
            if len(DEV_MAILBOX) > 50:
                DEV_MAILBOX.pop(0)
            return
        except Exception as exc:
            logger.warning(f"SMTP delivery to {to_email} encountered error: {exc}")
            if not settings.SMTP_DEV_FALLBACK:
                raise EmailDeliveryError(f"SMTP Email delivery failed: {str(exc)}")
            logger.info(f"Failing over to local Dev Mailbox for {to_email}")

    # 2. If SMTP is unconfigured and dev fallback is disabled, raise honest error
    if not is_smtp_configured() and not settings.SMTP_DEV_FALLBACK:
        raise SMTPNotConfiguredError(
            "Email service is unconfigured. SMTP credentials (SMTP_HOST, SMTP_PORT, "
            "SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL) must be configured in your server environment."
        )

    # 3. Development Mailbox Delivery (Local Dev & Verification)
    DEV_MAILBOX.append({
        "to_email": to_email,
        "subject": subject,
        "text_content": text_content,
        "html_content": html_content,
        "otp_code": otp_code,
        "dispatched_at": now_iso,
        "mode": "dev_mailbox"
    })
    if len(DEV_MAILBOX) > 50:
        DEV_MAILBOX.pop(0)

    logger.info(f"[DEV MAILBOX] Verification email delivered for {to_email} with subject: '{subject}'")

def send_registration_otp_email(to_email: str, full_name: str, otp_code: str) -> None:
    """Send Registration Verification Code via email."""
    subject = "Your RESUMIND AI Verification Code"
    
    text_content = f"""Hello {full_name},

Thank you for registering with RESUMIND AI.

Your 6-digit account verification code is: {otp_code}

This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.

SECURITY NOTICE: Do not share this code with anyone. RESUMIND AI staff will never request your code.

If you did not register for an account, please disregard this email.

— The RESUMIND AI Security Team
"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090909; color: #FFFFFF; margin: 0; padding: 24px; }}
        .card {{ max-width: 520px; margin: 0 auto; background-color: #141414; border: 1px solid #27272A; border-radius: 16px; padding: 32px; }}
        .logo {{ font-size: 20px; font-weight: 800; color: #E53945; letter-spacing: 0.05em; margin-bottom: 24px; }}
        h1 {{ font-size: 22px; font-weight: 700; color: #FFFFFF; margin-top: 0; }}
        p {{ color: #A1A1AA; font-size: 14px; line-height: 1.6; margin: 12px 0; }}
        .otp-container {{ margin: 28px 0; text-align: center; background-color: #1B1B1B; border: 1px solid #E53945; border-radius: 12px; padding: 20px; }}
        .otp-code {{ font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #FFFFFF; }}
        .badge {{ display: inline-block; background-color: rgba(229, 57, 69, 0.15); color: #E53945; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }}
        .alert {{ border-left: 3px solid #E5A83B; padding-left: 12px; margin-top: 24px; color: #71717A; font-size: 12px; }}
        .footer {{ font-size: 12px; color: #52525B; text-align: center; margin-top: 32px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">RESUMIND AI</div>
        <span class="badge">Account Verification</span>
        <h1>Welcome, {full_name}</h1>
        <p>Thank you for registering with RESUMIND AI. To complete your registration and activate your recruiter account, enter the one-time verification code below:</p>
        
        <div class="otp-container">
          <div class="otp-code">{otp_code}</div>
        </div>

        <p>This verification code is strictly valid for <strong>{settings.OTP_EXPIRY_MINUTES} minutes</strong> and can only be used once.</p>

        <div class="alert">
          <strong>Security Warning:</strong> Never share this code with anyone. RESUMIND AI support will never ask for your verification code.
        </div>

        <div class="footer">
          &copy; 2026 RESUMIND AI — Intelligent Candidate Ranking & Screening
        </div>
      </div>
    </body>
    </html>
    """
    _send_smtp_email(to_email, subject, text_content, html_content, otp_code=otp_code)

def send_login_otp_email(to_email: str, full_name: str, otp_code: str) -> None:
    """Send Two-Factor Authentication Login Code via email."""
    subject = "Your RESUMIND AI Verification Code"

    text_content = f"""Hello {full_name},

A login attempt was made for your RESUMIND AI recruiter account.

Your 6-digit login verification code is: {otp_code}

This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.

SECURITY NOTICE: Do not share this code with anyone. If you did not initiate this login request, please secure your password immediately.

— The RESUMIND AI Security Team
"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090909; color: #FFFFFF; margin: 0; padding: 24px; }}
        .card {{ max-width: 520px; margin: 0 auto; background-color: #141414; border: 1px solid #27272A; border-radius: 16px; padding: 32px; }}
        .logo {{ font-size: 20px; font-weight: 800; color: #E53945; letter-spacing: 0.05em; margin-bottom: 24px; }}
        h1 {{ font-size: 22px; font-weight: 700; color: #FFFFFF; margin-top: 0; }}
        p {{ color: #A1A1AA; font-size: 14px; line-height: 1.6; margin: 12px 0; }}
        .otp-container {{ margin: 28px 0; text-align: center; background-color: #1B1B1B; border: 1px solid #E53945; border-radius: 12px; padding: 20px; }}
        .otp-code {{ font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #FFFFFF; }}
        .badge {{ display: inline-block; background-color: rgba(53, 201, 139, 0.15); color: #35C98B; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }}
        .alert {{ border-left: 3px solid #E53945; padding-left: 12px; margin-top: 24px; color: #71717A; font-size: 12px; }}
        .footer {{ font-size: 12px; color: #52525B; text-align: center; margin-top: 32px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">RESUMIND AI</div>
        <span class="badge">Two-Factor Authentication</span>
        <h1>Sign In Verification</h1>
        <p>Hello <strong>{full_name}</strong>,</p>
        <p>A sign-in request was detected for your account. Please enter the following 6-digit security code to verify your identity:</p>
        
        <div class="otp-container">
          <div class="otp-code">{otp_code}</div>
        </div>

        <p>This one-time passcode will expire in <strong>{settings.OTP_EXPIRY_MINUTES} minutes</strong>.</p>

        <div class="alert">
          <strong>Security Notice:</strong> If you did not attempt to sign in, someone else may have your password. We recommend updating your credentials immediately.
        </div>

        <div class="footer">
          &copy; 2026 RESUMIND AI — Intelligent Candidate Ranking & Screening
        </div>
      </div>
    </body>
    </html>
    """
    _send_smtp_email(to_email, subject, text_content, html_content, otp_code=otp_code)

def send_password_reset_otp_email(to_email: str, full_name: str, otp_code: str) -> None:
    """Send Password Reset Code via email."""
    subject = "Your RESUMIND AI Password Reset Code"

    text_content = f"""Hello {full_name},

We received a request to reset your RESUMIND AI password.

Your 6-digit password reset code is: {otp_code}

This code will expire in {settings.OTP_EXPIRY_MINUTES} minutes.

If you did not request a password reset, please ignore this email.

— The RESUMIND AI Security Team
"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090909; color: #FFFFFF; margin: 0; padding: 24px; }}
        .card {{ max-width: 520px; margin: 0 auto; background-color: #141414; border: 1px solid #27272A; border-radius: 16px; padding: 32px; }}
        .logo {{ font-size: 20px; font-weight: 800; color: #E53945; letter-spacing: 0.05em; margin-bottom: 24px; }}
        h1 {{ font-size: 22px; font-weight: 700; color: #FFFFFF; margin-top: 0; }}
        p {{ color: #A1A1AA; font-size: 14px; line-height: 1.6; margin: 12px 0; }}
        .otp-container {{ margin: 28px 0; text-align: center; background-color: #1B1B1B; border: 1px solid #E5A83B; border-radius: 12px; padding: 20px; }}
        .otp-code {{ font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #FFFFFF; }}
        .badge {{ display: inline-block; background-color: rgba(229, 168, 59, 0.15); color: #E5A83B; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }}
        .alert {{ border-left: 3px solid #E5A83B; padding-left: 12px; margin-top: 24px; color: #71717A; font-size: 12px; }}
        .footer {{ font-size: 12px; color: #52525B; text-align: center; margin-top: 32px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">RESUMIND AI</div>
        <span class="badge">Password Reset</span>
        <h1>Reset Your Password</h1>
        <p>Hello <strong>{full_name}</strong>,</p>
        <p>We received a request to reset your RESUMIND AI account password. Enter the 6-digit verification code below to authorize the password reset:</p>
        
        <div class="otp-container">
          <div class="otp-code">{otp_code}</div>
        </div>

        <p>This verification code expires in <strong>{settings.OTP_EXPIRY_MINUTES} minutes</strong>.</p>

        <div class="alert">
          <strong>Security Notice:</strong> If you did not request this change, please ignore this email or contact security if you suspect unauthorized access.
        </div>

        <div class="footer">
          &copy; 2026 RESUMIND AI — Intelligent Candidate Ranking & Screening
        </div>
      </div>
    </body>
    </html>
    """
    _send_smtp_email(to_email, subject, text_content, html_content, otp_code=otp_code)
