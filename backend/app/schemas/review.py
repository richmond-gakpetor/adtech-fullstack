"""Review schemas"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
class ReviewTypeEnum(str, Enum):
    """Review type"""
    BILLBOARD = "billboard"
    OWNER = "owner"
    ADVERTISER = "advertiser"


# Review Schemas
class ReviewCreate(BaseModel):
    """Create a new review"""
    review_type: ReviewTypeEnum
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    title: str = Field(..., min_length=5, max_length=200, description="Review title")
    comment: str = Field(..., min_length=10, max_length=2000, description="Review comment")
    reviewee_id: Optional[str] = Field(None, description="User being reviewed (for owner/advertiser reviews)")
    billboard_id: Optional[str] = Field(None, description="Billboard being reviewed (for billboard reviews)")
    campaign_name: Optional[str] = Field(None, max_length=200, description="Campaign name reference")
    
    @field_validator("review_type")
    @classmethod
    def validate_review_type_fields(cls, v, info):
        """Validate that appropriate fields are provided based on review type"""
        # Note: Full validation will happen in the service layer with access to other fields
        return v


class ReviewUpdate(BaseModel):
    """Update an existing review"""
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    comment: Optional[str] = Field(None, min_length=10, max_length=2000)
    campaign_name: Optional[str] = Field(None, max_length=200)


class ReviewerInfo(BaseModel):
    """Reviewer information"""
    id: str
    name: str
    company: Optional[str] = None
    user_type: str
    is_verified: bool = False
    
    class Config:
        from_attributes = True


class ReviewResponse(BaseModel):
    """Review response"""
    id: str
    review_type: ReviewTypeEnum
    rating: int
    title: str
    comment: str
    campaign_name: Optional[str] = None
    is_verified: bool
    is_visible: bool
    helpful_count: int
    created_at: datetime
    updated_at: datetime
    
    # Reviewer info
    reviewer: ReviewerInfo
    
    # Optional related entities
    reviewee_id: Optional[str] = None
    billboard_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class ReviewListResponse(BaseModel):
    """Paginated review list response"""
    reviews: List[ReviewResponse]
    total: int
    page: int
    page_size: int
    average_rating: Optional[float] = None
    
    class Config:
        from_attributes = True


class MarkReviewHelpfulResponse(BaseModel):
    """Response when marking review as helpful"""
    success: bool
    helpful_count: int
    
    class Config:
        from_attributes = True
