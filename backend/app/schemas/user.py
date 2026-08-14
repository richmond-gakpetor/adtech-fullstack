"""User Pydantic schemas"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, UUID4, computed_field, field_validator
from app.models.user import UserType, KYCStatus
from app.schemas.common import TimestampMixin, IDMixin


# ============= Request Schemas =============


class UserCreate(BaseModel):
    """Schema for user registration"""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    user_type: UserType
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=20)
    company_name: Optional[str] = Field(None, max_length=255)
    business_type: Optional[str] = Field(None, max_length=100)

    @field_validator("user_type")
    @classmethod
    def validate_user_type(cls, v: UserType) -> UserType:
        """Prevent admin user creation via public API - use CLI script instead"""
        if v == UserType.ADMIN:
            raise ValueError("Admin accounts cannot be created via API.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserLogin(BaseModel):
    """Schema for user login"""

    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile"""

    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    company_name: Optional[str] = Field(None, max_length=255)
    business_type: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)


class PasswordChange(BaseModel):
    """Schema for changing password"""

    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class PasswordResetRequest(BaseModel):
    """Schema for requesting password reset"""

    email: EmailStr


class PasswordReset(BaseModel):
    """Schema for resetting password with token"""

    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# ============= Response Schemas =============


class UserResponse(IDMixin, TimestampMixin):
    """Schema for user response (public data)"""

    email: EmailStr
    user_type: UserType
    first_name: str
    last_name: str
    phone_number: str
    is_verified: bool
    is_active: bool

    # Email verification status
    email_verified: bool
    email_verified_at: Optional[datetime] = None

    # KYC status (for owners)
    kyc_status: str
    kyc_submission_count: int = 0
    kyc_submitted_at: Optional[datetime] = None
    kyc_reviewed_at: Optional[datetime] = None
    kyc_rejection_reason: Optional[str] = None

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @computed_field
    @property
    def can_list_billboards(self) -> bool:
        """Check if user can create billboard listings"""
        if self.user_type != UserType.OWNER:
            return False
        return self.email_verified and self.kyc_status == KYCStatus.APPROVED.value

    @computed_field
    @property
    def needs_email_verification(self) -> bool:
        return not self.email_verified

    @computed_field
    @property
    def needs_kyc(self) -> bool:
        if self.user_type != UserType.OWNER:
            return False
        return self.kyc_status in [KYCStatus.PENDING.value, KYCStatus.REJECTED.value]

    @computed_field
    @property
    def kyc_under_review(self) -> bool:
        return self.kyc_status == KYCStatus.SUBMITTED.value

    class Config:
        from_attributes = True


class UserPublicProfile(BaseModel):
    """Schema for public user profile (limited data)"""

    id: UUID4
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: Optional[str] = None
    company_name: Optional[str] = None
    user_type: UserType
    is_verified: bool

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    class Config:
        from_attributes = True


# ============= Verification Schemas =============


class EmailVerificationRequest(BaseModel):
    """Schema for requesting email verification"""

    email: EmailStr


class KYCSubmission(BaseModel):
    """Schema for confirming KYC form submission"""

    confirmed: bool = True
    notes: Optional[str] = Field(
        None, max_length=1000, description="Optional notes about your submission"
    )


class KYCReview(BaseModel):
    """Schema for admin KYC review"""

    action: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = Field(None, max_length=1000)
    rejection_reason: Optional[str] = Field(None, max_length=500)

    @field_validator("rejection_reason")
    @classmethod
    def validate_rejection_reason(cls, v: Optional[str], values) -> Optional[str]:
        """Rejection reason required if action is reject"""
        if values.data.get("action") == "reject" and not v:
            raise ValueError("Rejection reason is required when rejecting KYC")
        return v


class VerificationStatus(BaseModel):
    """Schema for verification status response"""

    email_verified: bool
    email_verified_at: Optional[datetime] = None
    kyc_status: str
    kyc_submission_count: int = 0
    kyc_submitted_at: Optional[datetime] = None
    kyc_reviewed_at: Optional[datetime] = None
    kyc_rejection_reason: Optional[str] = None
    can_list_billboards: bool
    needs_email_verification: bool
    needs_kyc: bool
    kyc_under_review: bool


# ============= Token Schemas =============


class Token(BaseModel):
    """Schema for authentication tokens"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Schema for JWT token payload"""

    sub: str  # User ID
    email: str
    user_type: str
    exp: datetime
    iat: datetime


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""

    refresh_token: str


# ============= Auth Response Schemas =============


class AuthResponse(BaseModel):
    """Schema for authentication response"""

    user: UserResponse
    tokens: Token
