"""Payment schemas"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class PaymentStatusEnum(str, Enum):
    """Payment status"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class PaymentTypeEnum(str, Enum):
    """Payment type"""
    LISTING_ACCESS = "listing_access"


# Request Schemas
class InitializePaymentRequest(BaseModel):
    """Request to initialize a payment"""
    billboard_id: str = Field(..., description="Billboard UUID to pay for listing access")
    tier_id: str = Field(..., description="Listing tier ID (7d or 14d)")
    
    @field_validator("billboard_id")
    @classmethod
    def validate_billboard_id(cls, v: str) -> str:
        """Validate billboard_id is a valid UUID"""
        from uuid import UUID
        try:
            UUID(v)
        except (ValueError, AttributeError):
            raise ValueError(f"Invalid billboard_id. Must be a valid UUID, got: '{v}'")
        return v
    
    @field_validator("tier_id")
    @classmethod
    def validate_tier_id(cls, v: str) -> str:
        """Validate tier ID"""
        if v not in ["7d", "14d"]:
            raise ValueError("Invalid tier_id. Must be '7d' or '14d'")
        return v


class VerifyPaymentRequest(BaseModel):
    """Request to verify a payment"""
    reference: str = Field(..., description="Paystack payment reference")


class PaystackWebhookEvent(BaseModel):
    """Paystack webhook event payload"""
    event: str
    data: Dict[str, Any]


# Response Schemas
class PaymentInitializeResponse(BaseModel):
    """Response from payment initialization"""
    payment_id: str
    reference: str
    authorization_url: str
    access_code: str
    amount_ghs: float
    
    class Config:
        from_attributes = True


class ListingTierInfo(BaseModel):
    """Listing tier information"""
    tier_id: str
    duration_days: int
    price_ghs: int
    access_starts_at: Optional[datetime] = None
    access_expires_at: Optional[datetime] = None
    is_active: bool
    
    class Config:
        from_attributes = True


class PaymentResponse(BaseModel):
    """Payment details response"""
    id: str
    reference: str
    type: PaymentTypeEnum
    status: PaymentStatusEnum
    amount_ghs: float
    currency: str
    paid_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    
    # Listing payment details (if applicable)
    listing_details: Optional[ListingTierInfo] = None
    
    class Config:
        from_attributes = True


class PaymentHistoryResponse(BaseModel):
    """Payment history response"""
    payments: list[PaymentResponse]
    total: int
    page: int
    page_size: int
    
    class Config:
        from_attributes = True


class PaymentVerifyResponse(BaseModel):
    """Payment verification response"""
    success: bool
    payment: PaymentResponse
    message: str
    
    class Config:
        from_attributes = True


class BillboardListingStatus(BaseModel):
    """Billboard listing access status"""
    billboard_id: str
    has_active_listing: bool
    access_starts_at: Optional[datetime] = None
    access_expires_at: Optional[datetime] = None
    days_remaining: Optional[int] = None  # None if no active listing
    is_expired: bool
    is_in_grace_period: bool
    grace_period_expires_at: Optional[datetime] = None
    can_renew: bool  # True if expired or expiring soon
    current_tier: Optional[ListingTierInfo] = None
    
    class Config:
        from_attributes = True
