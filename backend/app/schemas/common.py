"""Common Pydantic schemas used across the application"""

from typing import Any, Optional, Generic, TypeVar, List
from datetime import datetime
from pydantic import BaseModel, Field, UUID4


# Generic type for data responses
T = TypeVar("T")


class ResponseModel(BaseModel, Generic[T]):
    """Standard API response wrapper"""
    
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    errors: Optional[List[dict]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {"id": "123", "name": "Example"},
                "message": "Operation successful",
                "errors": None
            }
        }


# Alias for backward compatibility
APIResponse = ResponseModel


class PaginationParams(BaseModel):
    """Pagination query parameters"""
    
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    limit: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @property
    def skip(self) -> int:
        """Calculate offset for database query"""
        return (self.page - 1) * self.limit


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper"""
    
    items: List[T]
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool
    
    @staticmethod
    def create(
        items: List[T],
        total: int,
        page: int,
        limit: int
    ) -> "PaginatedResponse[T]":
        """Create paginated response from items and pagination info"""
        total_pages = (total + limit - 1) // limit
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )


class TimestampMixin(BaseModel):
    """Mixin for models with timestamps"""
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class IDMixin(BaseModel):
    """Mixin for models with UUID ID"""
    
    id: UUID4
    
    class Config:
        from_attributes = True


class Coordinates(BaseModel):
    """Geographic coordinates"""
    
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")
    
    class Config:
        json_schema_extra = {
            "example": {
                "lat": 5.6507,
                "lng": -0.1648
            }
        }
