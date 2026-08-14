from fastapi import APIRouter
from app.schemas.common import ResponseModel
from app.config import settings
from pydantic import BaseModel


router = APIRouter()


class PublicConfigResponse(BaseModel):
    """Public configuration visible to frontend"""
    require_payment_for_visibility: bool
    promotional_listing_days: int
    listing_grace_days: int


@router.get(
    "/public-config",
    response_model=ResponseModel[PublicConfigResponse],
    summary="Get public configuration",
    description="Frontend configuration settings (read-only)"
)
async def get_public_config():
    """
    Get public configuration settings for the frontend.
    
    This allows the frontend to adapt UI based on backend configuration:
    - Show/hide pricing flows during promo mode
    - Display correct promotional messaging
    - Inform users of grace periods
    """
    return ResponseModel(
        success=True,
        data=PublicConfigResponse(
            require_payment_for_visibility=settings.REQUIRE_PAYMENT_FOR_VISIBILITY,
            promotional_listing_days=settings.PROMOTIONAL_LISTING_DAYS,
            listing_grace_days=settings.LISTING_GRACE_DAYS
        ),
        message="Configuration retrieved successfully"
    )
