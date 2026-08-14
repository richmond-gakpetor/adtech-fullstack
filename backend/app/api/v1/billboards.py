"""Billboard endpoints"""

from typing import Optional
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.core.auth import get_current_user, get_current_owner, get_optional_user
from app.schemas.billboard import (
    BillboardCreate,
    BillboardUpdate,
    BillboardResponse,
    BillboardDetailResponse,
    BillboardListItem,
    BillboardFilters
)
from app.schemas.payment import BillboardListingStatus
from app.schemas.common import ResponseModel, PaginationParams, PaginatedResponse
from app.schemas.user import UserPublicProfile
from app.services.billboard_service import BillboardService
from app.services.payment_service import payment_service
from app.models.user import User
from app.core.exceptions import ForbiddenException


router = APIRouter()


@router.post(
    "",
    response_model=ResponseModel[BillboardResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create billboard",
    description="Create a new billboard listing (owners only)"
)
async def create_billboard(
    billboard_data: BillboardCreate,
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    """Create a new billboard listing"""
    
    billboard = await BillboardService.create_billboard(
        db,
        current_user,
        billboard_data
    )
    
    return ResponseModel(
        success=True,
        data=BillboardResponse.model_validate(billboard),
        message="Billboard created successfully"
    )


@router.get(
    "",
    response_model=ResponseModel[PaginatedResponse[BillboardListItem]],
    summary="Browse billboards",
    description="Get billboards with filters and pagination"
)
async def browse_billboards(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    location: Optional[str] = None,
    type: Optional[str] = None,
    availability: Optional[str] = None,
    min_weekly_rate: Optional[int] = None,
    max_weekly_rate: Optional[int] = None,
    min_monthly_rate: Optional[int] = None,
    max_monthly_rate: Optional[int] = None,
    min_views: Optional[int] = None,
    is_promoted: Optional[bool] = None,
    search: Optional[str] = None,
    owner_id: Optional[UUID] = None,
    # Proximity search parameters
    near_lat: Optional[float] = Query(None, description="Latitude for proximity search"),
    near_lng: Optional[float] = Query(None, description="Longitude for proximity search"),
    radius_km: Optional[float] = Query(5.0, ge=0.1, le=100, description="Search radius in km"),
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Browse billboards with advanced filtering"""
    
    # Convert type string to BillboardType enum if provided
    billboard_type = None
    if type:
        try:
            from app.models.billboard import BillboardType
            billboard_type = BillboardType(type)
        except ValueError:
            pass
    
    # Convert availability string to boolean
    is_available = None
    if availability == "available":
        is_available = True
    elif availability == "unavailable":
        is_available = False
    
    filters = BillboardFilters(
        location=location,
        billboard_type=billboard_type,
        is_available=is_available,
        min_weekly_rate=min_weekly_rate,
        max_weekly_rate=max_weekly_rate,
        min_monthly_rate=min_monthly_rate,
        max_monthly_rate=max_monthly_rate,
        min_views=min_views,
        search=search,
        owner_id=owner_id,
        near_lat=near_lat,
        near_lng=near_lng,
        radius_km=radius_km if near_lat and near_lng else None
    )
    
    pagination = PaginationParams(page=page, limit=limit)
    
    billboards, total = await BillboardService.get_billboards(
        db,
        filters,
        pagination,
        current_user
    )
    
    items = [BillboardListItem.model_validate(b) for b in billboards]
    
    paginated = PaginatedResponse.create(
        items=items,
        total=total,
        page=page,
        limit=limit
    )
    
    return ResponseModel(
        success=True,
        data=paginated,
        message=f"Found {total} billboards"
    )


@router.get(
    "/{billboard_id}",
    response_model=ResponseModel[BillboardDetailResponse],
    summary="Get billboard details",
    description="Get detailed information about a specific billboard"
)
async def get_billboard(
    billboard_id: UUID,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Get billboard details"""
    
    billboard = await BillboardService.get_billboard_by_id(
        db,
        billboard_id,
        load_owner=True
    )
    
    # Check if current user has saved this billboard
    is_saved = False
    if current_user:
        is_saved = await BillboardService.is_billboard_saved(
            db,
            current_user,
            billboard_id
        )
    
    # Build response
    response_data = BillboardDetailResponse.model_validate(billboard)
    response_data.is_saved = is_saved
    response_data.total_saves = len(billboard.saved_by) if billboard.saved_by else 0
    
    return ResponseModel(
        success=True,
        data=response_data,
        message="Billboard retrieved successfully"
    )


@router.patch(
    "/{billboard_id}",
    response_model=ResponseModel[BillboardResponse],
    summary="Update billboard",
    description="Update billboard information (owner only)"
)
async def update_billboard(
    billboard_id: UUID,
    update_data: BillboardUpdate,
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    """Update billboard"""
    
    billboard = await BillboardService.get_billboard_by_id(db, billboard_id)
    
    updated_billboard = await BillboardService.update_billboard(
        db,
        billboard,
        current_user,
        update_data
    )
    
    return ResponseModel(
        success=True,
        data=BillboardResponse.model_validate(updated_billboard),
        message="Billboard updated successfully"
    )


@router.delete(
    "/{billboard_id}",
    response_model=ResponseModel[dict],
    summary="Delete billboard",
    description="Delete billboard (owner only, soft delete)"
)
async def delete_billboard(
    billboard_id: UUID,
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    """Delete billboard"""
    
    billboard = await BillboardService.get_billboard_by_id(db, billboard_id)
    
    await BillboardService.delete_billboard(db, billboard, current_user)
    
    return ResponseModel(
        success=True,
        data={"message": "Billboard deleted successfully"},
        message="Billboard deleted"
    )


@router.post(
    "/{billboard_id}/view",
    response_model=ResponseModel[dict],
    summary="Increment view count",
    description="Increment billboard view count"
)
async def increment_billboard_views(
    billboard_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Increment billboard view count"""
    
    await BillboardService.increment_views(db, billboard_id)
    
    return ResponseModel(
        success=True,
        data={"message": "View count incremented"},
        message="View recorded"
    )


@router.post(
    "/{billboard_id}/save",
    response_model=ResponseModel[dict],
    summary="Save billboard",
    description="Save/bookmark a billboard"
)
async def save_billboard(
    billboard_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Save/bookmark a billboard"""
    
    await BillboardService.save_billboard(db, current_user, billboard_id)
    
    return ResponseModel(
        success=True,
        data={"message": "Billboard saved successfully"},
        message="Billboard saved"
    )


@router.delete(
    "/{billboard_id}/save",
    response_model=ResponseModel[dict],
    summary="Unsave billboard",
    description="Remove billboard from saved/bookmarks"
)
async def unsave_billboard(
    billboard_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unsave/unbookmark a billboard"""
    
    await BillboardService.unsave_billboard(db, current_user, billboard_id)
    
    return ResponseModel(
        success=True,
        data={"message": "Billboard removed from saved"},
        message="Billboard unsaved"
    )


@router.get(
    "/saved/list",
    response_model=ResponseModel[PaginatedResponse[BillboardListItem]],
    summary="Get saved billboards",
    description="Get user's saved/bookmarked billboards"
)
async def get_saved_billboards(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get saved billboards"""
    
    pagination = PaginationParams(page=page, limit=limit)
    
    billboards, total = await BillboardService.get_saved_billboards(
        db,
        current_user,
        pagination
    )
    
    items = [BillboardListItem.model_validate(b) for b in billboards]
    
    paginated = PaginatedResponse.create(
        items=items,
        total=total,
        page=page,
        limit=limit
    )
    
    return ResponseModel(
        success=True,
        data=paginated,
        message=f"Found {total} saved billboards"
    )


@router.get(
    "/owner/my-billboards",
    response_model=ResponseModel[PaginatedResponse[BillboardResponse]],
    summary="Get my billboards",
    description="Get all billboards owned by current user"
)
async def get_my_billboards(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    """Get current owner's billboards"""
    
    pagination = PaginationParams(page=page, limit=limit)
    
    billboards, total = await BillboardService.get_owner_billboards(
        db,
        current_user.id,
        pagination
    )
    
    items = [BillboardResponse.model_validate(b) for b in billboards]
    
    paginated = PaginatedResponse.create(
        items=items,
        total=total,
        page=page,
        limit=limit
    )
    
    return ResponseModel(
        success=True,
        data=paginated,
        message=f"Found {total} billboards"
    )


@router.get(
    "/{billboard_id}/listing-status",
    response_model=ResponseModel[BillboardListingStatus],
    summary="Get billboard listing status",
    description="Get the listing access status for a billboard (owner only)"
)
async def get_billboard_listing_status(
    billboard_id: UUID,
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    """Get billboard listing access status"""
    
    # Verify ownership
    billboard = await BillboardService.get_billboard_by_id(db, billboard_id)
    
    if billboard.owner_id != current_user.id:
        raise ForbiddenException(detail="You don't have permission to view this billboard's listing status")
    
    # Get listing status from payment service
    listing_status = await payment_service.get_billboard_listing_status(
        db,
        billboard_id
    )
    
    return ResponseModel(
        success=True,
        data=listing_status,
        message="Listing status retrieved successfully"
    )
