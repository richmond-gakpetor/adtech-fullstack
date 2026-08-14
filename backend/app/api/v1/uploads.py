"""File upload endpoints"""

from fastapi import APIRouter, Depends, UploadFile, File, status, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import update, text
from typing import List
from uuid import UUID
import logging
from app.core.database import get_db
from app.core.auth import get_current_owner
from app.schemas.common import ResponseModel
from app.services.upload_service import UploadService
from app.models.user import User
from app.models.billboard import Billboard
from pydantic import BaseModel

logger = logging.getLogger(__name__)


router = APIRouter()


# ============= Response Schemas =============

class MultiUploadUrlResponse(BaseModel):
    """Response for multiple image uploads"""
    urls: List[str]
    count: int


# ============= Endpoints =============

@router.post(
    "/billboard-images",
    response_model=ResponseModel[MultiUploadUrlResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload billboard images",
    description="Upload images for a billboard (owner only). Max 10 images, 10MB each."
)
async def upload_billboard_images(
    files: List[UploadFile] = File(..., description="Image files (JPEG, PNG, WebP, GIF)"),
    billboard_id: str = Form(..., description="Billboard UUID to attach images to"),
    current_user: User = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db)
):
    """Upload multiple billboard images and attach to billboard"""
    
    # Upload images to S3
    urls = await UploadService.upload_billboard_images(files, current_user)
    
    # Update billboard with image URLs
    from app.services.billboard_service import BillboardService
    billboard = await BillboardService.get_billboard_by_id(db, UUID(billboard_id))
    
    # Verify ownership
    if billboard.owner_id != current_user.id:
        from app.core.exceptions import ForbiddenException
        raise ForbiddenException(detail="Not authorized to upload images for this billboard")
    
    # Append new URLs to existing images (up to max limit)
    MAX_IMAGES = 10
    current_images = list(billboard.images) if billboard.images else []
    updated_images = current_images + urls
    
    # Trim to max if needed
    if len(updated_images) > MAX_IMAGES:
        updated_images = updated_images[:MAX_IMAGES]
    
    logger.info(f"📸 Updating billboard {billboard_id} with {len(urls)} new images")
    logger.info(f"   Current images: {len(current_images)}, Total after update: {len(updated_images)}")
    
    # BULLETPROOF FIX: Use raw SQL UPDATE for PostgreSQL ARRAY
    # This bypasses SQLAlchemy ORM mutation tracking issues entirely
    stmt = (
        update(Billboard)
        .where(Billboard.id == billboard.id)
        .values(images=updated_images)
    )
    await db.execute(stmt)
    await db.commit()
    
    # Refresh to get updated state
    await db.refresh(billboard)
    
    logger.info(f"✅ Billboard {billboard_id} images updated. DB now has: {len(billboard.images)} images")
    logger.info(f"   Image URLs: {billboard.images}")
    
    return ResponseModel(
        success=True,
        data=MultiUploadUrlResponse(urls=urls, count=len(urls)),
        message=f"Successfully uploaded {len(urls)} images and attached to billboard"
    )
