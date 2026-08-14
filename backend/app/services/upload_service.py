"""Upload service for managing file uploads"""

from typing import List, Optional
from uuid import UUID
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy import update
import logging
from app.core.s3 import s3_client
from app.core.exceptions import BadRequestException
from app.services.billboard_service import BillboardService
from app.models.user import User
from app.models.billboard import Billboard

logger = logging.getLogger(__name__)


class UploadService:
    """Service class for file upload operations"""
    
    # Allowed image formats
    ALLOWED_IMAGE_TYPES = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'image/gif': ['.gif']
    }
    
    # Maximum file sizes
    MAX_BILLBOARD_IMAGE_SIZE_MB = 10
    MAX_IMAGES_PER_BILLBOARD = 10
    
    @staticmethod
    def validate_image_file(file: UploadFile):
        """
        Validate image file before upload.
        
        Args:
            file: Upload file object
            
        Raises:
            BadRequestException: If validation fails
        """
        # Check content type
        if file.content_type not in UploadService.ALLOWED_IMAGE_TYPES:
            allowed = ', '.join(UploadService.ALLOWED_IMAGE_TYPES.keys())
            raise BadRequestException(
                detail=f"Invalid file type. Allowed types: {allowed}"
            )
        
        # Check file extension
        filename_lower = file.filename.lower()
        valid_extensions = []
        for extensions in UploadService.ALLOWED_IMAGE_TYPES.values():
            valid_extensions.extend(extensions)
        
        if not any(filename_lower.endswith(ext) for ext in valid_extensions):
            raise BadRequestException(
                detail=f"Invalid file extension. Allowed extensions: {', '.join(valid_extensions)}"
            )
    
    @staticmethod
    async def upload_billboard_image(
        file: UploadFile,
        user: User
    ) -> str:
        """
        Upload a single billboard image.
        
        Args:
            file: Upload file object
            user: Current user
            
        Returns:
            Public URL of uploaded image
            
        Raises:
            BadRequestException: If validation fails
        """
        try:
            # Validate file
            UploadService.validate_image_file(file)
            
            # Upload to S3
            url = await s3_client.upload_file(
                file=file.file,
                filename=file.filename,
                content_type=file.content_type,
                folder=f"billboards/{user.id}",
                max_size_mb=UploadService.MAX_BILLBOARD_IMAGE_SIZE_MB
            )
            
            logger.info(f"✅ Billboard image uploaded by user {user.id}: {url}")
            return url
        
        except Exception as e:
            logger.error(f"❌ Failed to upload billboard image: {e}")
            raise
    
    @staticmethod
    async def upload_billboard_images(
        files: List[UploadFile],
        user: User
    ) -> List[str]:
        """
        Upload multiple billboard images.
        
        Args:
            files: List of upload file objects
            user: Current user
            
        Returns:
            List of public URLs
            
        Raises:
            BadRequestException: If validation fails
        """
        # Validate number of files
        if len(files) > UploadService.MAX_IMAGES_PER_BILLBOARD:
            raise BadRequestException(
                detail=f"Maximum {UploadService.MAX_IMAGES_PER_BILLBOARD} images allowed per upload"
            )
        
        urls = []
        
        for file in files:
            url = await UploadService.upload_billboard_image(file, user)
            urls.append(url)
        
        return urls
    
    @staticmethod
    async def delete_billboard_images(
        db: AsyncSession,
        billboard_id: UUID,
        user: User,
        image_urls: List[str]
    ) -> int:
        """
        Delete billboard images and update database.
        
        Args:
            db: Database session
            billboard_id: Billboard UUID
            user: Current user (must be owner)
            image_urls: List of image URLs to delete
            
        Returns:
            Number of images deleted
            
        Raises:
            ForbiddenException: If user is not the billboard owner
        """
        # Get billboard
        billboard = await BillboardService.get_billboard_by_id(db, billboard_id)
        
        # Verify ownership
        if billboard.owner_id != user.id:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException(detail="Not authorized to delete images for this billboard")
        
        # Delete from S3
        deleted_count = await s3_client.delete_multiple_files(image_urls)
        
        # Update database - remove deleted URLs
        if deleted_count > 0:
            current_images = list(billboard.images) if billboard.images else []
            remaining_images = [url for url in current_images if url not in image_urls]
            
            logger.info(f"🗑️ Removing {deleted_count} images from billboard {billboard_id}")
            logger.info(f"   Remaining images: {len(remaining_images)}")
            
            # BULLETPROOF FIX: Use raw SQL UPDATE for PostgreSQL ARRAY
            stmt = (
                update(Billboard)
                .where(Billboard.id == billboard_id)
                .values(images=remaining_images)
            )
            await db.execute(stmt)
            await db.commit()
            
            # Refresh to get updated state
            await db.refresh(billboard)
            
            logger.info(f"✅ Billboard {billboard_id} images updated. DB now has: {len(billboard.images)} images")
        
        logger.info(f"✅ Deleted {deleted_count} images from billboard {billboard_id}")
        return deleted_count
    
    @staticmethod
    def generate_presigned_upload_url(
        filename: str,
        content_type: str,
        user: User
    ) -> dict:
        """
        Generate pre-signed URL for direct client-side upload.
        
        This is useful for large files or when you want to reduce
        server load by allowing direct uploads to S3.
        
        Args:
            filename: Original filename
            content_type: MIME type
            user: Current user
            
        Returns:
            Pre-signed upload data
            
        Raises:
            BadRequestException: If validation fails
        """
        # Validate content type
        if content_type not in UploadService.ALLOWED_IMAGE_TYPES:
            allowed = ', '.join(UploadService.ALLOWED_IMAGE_TYPES.keys())
            raise BadRequestException(
                detail=f"Invalid file type. Allowed types: {allowed}"
            )
        
        # Generate pre-signed URL
        return s3_client.generate_presigned_upload_url(
            filename=filename,
            content_type=content_type,
            folder=f"billboards/{user.id}",
            expiration=3600  # 1 hour
        )
    
    @staticmethod
    async def cleanup_orphaned_images(
        db: AsyncSession,
        user: User,
        image_urls: List[str]
    ):
        """
        Clean up images that were uploaded but not attached to any billboard.
        
        Call this if billboard creation fails after images were uploaded.
        
        Args:
            db: Database session
            user: Current user
            image_urls: List of image URLs to clean up
        """
        deleted_count = await s3_client.delete_multiple_files(image_urls)
        logger.info(f"🧹 Cleaned up {deleted_count} orphaned images for user {user.id}")
