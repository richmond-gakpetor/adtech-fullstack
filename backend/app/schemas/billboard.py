"""Billboard Pydantic schemas"""

from typing import Optional, List
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field, UUID4, field_validator
from app.models.billboard import BillboardType
from app.schemas.common import TimestampMixin, IDMixin, Coordinates
from app.schemas.user import UserPublicProfile


# ============= Request Schemas =============

class BillboardCreate(BaseModel):
    """Schema for creating a billboard"""
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=20, max_length=5000)
    location: str = Field(..., min_length=3, max_length=300)
    full_address: Optional[str] = Field(None, description="Detailed address")
    coordinates: Coordinates
    billboard_type: BillboardType
    width_ft: float = Field(..., gt=0, description="Width in feet")
    height_ft: float = Field(..., gt=0, description="Height in feet")
    orientation: Optional[str] = Field(None, max_length=50, description="Horizontal, Vertical, Square")
    illumination: Optional[str] = Field(None, max_length=50, description="Lit, Unlit, Backlit")
    weekly_rate: Decimal = Field(..., gt=0, description="Weekly rate in GHS")
    monthly_rate: Optional[Decimal] = Field(None, gt=0, description="Monthly rate in GHS")
    printing_fee: Optional[Decimal] = Field(None, ge=0, description="Printing fee for static billboards")
    flight_fee: Optional[Decimal] = Field(None, ge=0, description="Flight fee for static billboards")
    minimum_duration: Optional[str] = Field(None, max_length=50, description="Minimum rental duration")
    features: List[str] = Field(default_factory=list, description="Billboard features")
    nearby_landmarks: List[str] = Field(default_factory=list, description="Nearby landmarks")
    available_from: Optional[str] = Field(None, description="Availability start date")
    available_to: Optional[str] = Field(None, description="Availability end date")
    images: List[str] = Field(default_factory=list, description="Array of image URLs")
    contact_name: Optional[str] = Field(None, max_length=200, description="Override contact name (admin use)")
    contact_phone: Optional[str] = Field(None, max_length=20, description="Override contact phone (admin use)")


class BillboardUpdate(BaseModel):
    """Schema for updating a billboard"""
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    description: Optional[str] = Field(None, min_length=20, max_length=5000)
    location: Optional[str] = Field(None, min_length=3, max_length=300)
    full_address: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    orientation: Optional[str] = Field(None, max_length=50)
    illumination: Optional[str] = Field(None, max_length=50)
    weekly_rate: Optional[Decimal] = Field(None, gt=0)
    monthly_rate: Optional[Decimal] = Field(None, gt=0)
    printing_fee: Optional[Decimal] = Field(None, ge=0)
    flight_fee: Optional[Decimal] = Field(None, ge=0)
    minimum_duration: Optional[str] = Field(None, max_length=50)
    features: Optional[List[str]] = None
    nearby_landmarks: Optional[List[str]] = None
    available_from: Optional[str] = None
    available_to: Optional[str] = None
    images: Optional[List[str]] = None
    is_available: Optional[bool] = None
    contact_name: Optional[str] = Field(None, max_length=200)
    contact_phone: Optional[str] = Field(None, max_length=20)


class BillboardFilters(BaseModel):
    """Schema for filtering billboards"""
    location: Optional[str] = Field(None, description="Filter by location (partial match)")
    billboard_type: Optional[BillboardType] = None
    is_available: Optional[bool] = None
    min_weekly_rate: Optional[Decimal] = Field(None, ge=0)
    max_weekly_rate: Optional[Decimal] = Field(None, ge=0)
    min_monthly_rate: Optional[Decimal] = Field(None, ge=0)
    max_monthly_rate: Optional[Decimal] = Field(None, ge=0)
    min_views: Optional[int] = Field(None, ge=0)
    search: Optional[str] = Field(None, description="Search in title and location")
    owner_id: Optional[UUID4] = Field(None, description="Filter by owner")
    # Proximity search parameters
    near_lat: Optional[float] = Field(None, description="Latitude for proximity search")
    near_lng: Optional[float] = Field(None, description="Longitude for proximity search")
    radius_km: Optional[float] = Field(5.0, ge=0.1, le=100, description="Search radius in km (default 5km)")


# ============= Response Schemas =============

class BillboardResponse(IDMixin, TimestampMixin):
    """Schema for billboard response"""
    owner_id: UUID4
    title: str
    description: str
    location: str
    full_address: Optional[str] = None
    coordinates: Coordinates
    billboard_type: str
    width_ft: float
    height_ft: float
    orientation: Optional[str] = None
    illumination: Optional[str] = None
    weekly_rate: Decimal
    monthly_rate: Optional[Decimal] = None
    printing_fee: Optional[Decimal] = None
    flight_fee: Optional[Decimal] = None
    minimum_duration: Optional[str] = None
    features: List[str]
    nearby_landmarks: List[str]
    available_from: Optional[str] = None
    available_to: Optional[str] = None
    images: List[str]
    is_available: bool
    is_active: bool
    views: int
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True


class BillboardDetailResponse(BillboardResponse):
    """Schema for detailed billboard response with owner info"""
    owner: UserPublicProfile
    is_saved: Optional[bool] = False  # Whether current user has saved this billboard
    total_saves: Optional[int] = 0
    
    class Config:
        from_attributes = True


class BillboardListItem(BaseModel):
    """Lightweight schema for billboard list"""
    id: UUID4
    title: str
    location: str
    coordinates: Optional[Coordinates] = None
    billboard_type: str
    width_ft: float
    height_ft: float
    weekly_rate: Decimal
    monthly_rate: Optional[Decimal] = None
    images: List[str]
    is_available: bool
    views: int
    owner_id: UUID4
    
    class Config:
        from_attributes = True


class BillboardStatsResponse(BaseModel):
    """Schema for billboard statistics"""
    total_billboards: int
    active_billboards: int
    total_views: int
    average_weekly_rate: Decimal
