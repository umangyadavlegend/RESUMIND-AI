from typing import Optional
from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.models.session import UserSession

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    bearer_token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """
    Validate session from secure HttpOnly cookie or Authorization header.
    Validates active server-side session and expiration.
    Rejects with 401 Unauthorized if session is invalid, expired, or logged out.
    """
    token = None

    # 1. Primary: Extract from secure HttpOnly cookie
    if request.cookies and "resumind_session" in request.cookies:
        token = request.cookies.get("resumind_session")

    # 2. Secondary: Extract from Authorization Bearer header if cookie is absent
    if not token and bearer_token:
        token = bearer_token
    elif not token and request.headers.get("Authorization"):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Server-side session lookup in database
    now_utc = datetime.now(timezone.utc)
    db_session = db.query(UserSession).filter(
        UserSession.session_token == token
    ).first()

    if db_session:
        # Check if session was invalidated (logged out)
        if not db_session.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been logged out. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check session expiration
        # Note: handle both tz-aware and tz-naive dates from sqlite
        expires_at = db_session.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < now_utc:
            db_session.is_active = False
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = db.query(User).filter(User.id == db_session.user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account email is not verified. Please complete verification.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user

    # 4. Fallback for JWT tokens (e.g. CLI or integration test tokens)
    payload = decode_access_token(token)
    if payload and payload.get("sub"):
        user = db.query(User).filter(User.id == int(payload["sub"])).first()
        if user and user.is_active and user.is_verified:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
