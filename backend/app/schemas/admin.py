from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.models.user import UserType


class UserTypeUpdate(str, Enum):
    OWNER = "owner"
    ADVERTISER = "advertiser"
    ADMIN = "admin"


class UserStatusUpdate(BaseModel):
    is_active: Optional[bool] = Field(None, description="User active status")
    is_verified: Optional[bool] = Field(None, description="User verified status")


class UserTypeChangeRequest(BaseModel):
    user_type: UserTypeUpdate = Field(..., description="New user type")


class AdminUserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: Optional[str]
    user_type: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    # Email verification
    email_verified: bool
    email_verified_at: Optional[datetime] = None
    
    # KYC fields (for owners)
    kyc_status: Optional[str] = None
    kyc_submission_count: Optional[int] = 0
    kyc_submitted_at: Optional[datetime] = None
    kyc_reviewed_at: Optional[datetime] = None
    kyc_rejection_reason: Optional[str] = None
    
    # Statistics (will be populated by service)
    billboard_count: Optional[int] = 0
    review_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    """Paginated list of users for admin"""
    users: List[AdminUserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AdminStatsResponse(BaseModel):
    """Platform statistics for admin dashboard"""
    total_users: int
    active_users: int
    total_owners: int
    total_advertisers: int
    total_admins: int
    total_billboards: int
    active_billboards: int
    total_reviews: int
    total_payments: int
    total_revenue_ghs: float


class AdminPermissionResponse(BaseModel):
    user_id: str
    user_type: str
    permissions: List[str]
