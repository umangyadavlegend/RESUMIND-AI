from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: str
    company_name: Optional[str] = ""
    phone_number: Optional[str] = ""
    role: Optional[str] = "recruiter"

# Real User Registration Request
class UserRegisterRequest(BaseModel):
    full_name: str
    email: str
    phone_number: Optional[str] = ""
    company_name: Optional[str] = ""
    password: str
    confirm_password: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        clean = v.strip().lower()
        if "@" not in clean or "." not in clean.split("@")[-1]:
            raise ValueError("Please provide a valid work email address.")
        return clean

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must contain at least 8 characters.")
        return v

class VerifyRegistrationOtpRequest(BaseModel):
    email: str
    otp: str

class LoginStep1Request(BaseModel):
    email: str
    password: str

class VerifyLoginOtpRequest(BaseModel):
    email: str
    otp: str

class ResendOtpRequest(BaseModel):
    email: str
    purpose: str = "registration"  # "registration" | "login" | "reset"

class ForgotPasswordRequest(BaseModel):
    email: str

class VerifyResetOtpRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must contain at least 8 characters.")
        return v

# Legacy support aliases
UserCreate = UserRegisterRequest
UserLogin = LoginStep1Request

class UserVerify(BaseModel):
    email: str
    code: str

class UserResendVerification(BaseModel):
    email: str

class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_verified: bool = False
    created_at: datetime

class AuthResponse(BaseModel):
    user: Optional[UserOut] = None
    message: str = "Success"
    status: Optional[str] = "success"
    access_token: Optional[str] = None

class LoginStep1Response(BaseModel):
    status: str = "otp_required"
    message: str
    email: str

class GenericResponse(BaseModel):
    status: str = "success"
    message: str
