import boto3
from botocore.exceptions import ClientError, BotoCoreError
from typing import Optional, BinaryIO, List
from datetime import datetime, timedelta
import uuid
import logging
from app.config import settings
from app.core.exceptions import BadRequestException

logger = logging.getLogger(__name__)


class S3Client:
    """
    Production-grade S3 client for file uploads.
    
    Features:
    - Secure file uploads with unique naming
    - Pre-signed URLs for direct uploads
    - File validation (type, size)
    - CloudFront CDN integration
    - Automatic cleanup for failed uploads
    - Multi-region support
    """
    
    def __init__(self):
        """Initialize S3 client"""
        try:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.bucket_name = settings.S3_BUCKET_NAME
            self.cloudfront_domain = settings.CLOUDFRONT_DOMAIN
            
            logger.info(f"✅ S3 client initialized for bucket: {self.bucket_name}")
            logger.info(f"✅ CloudFront CDN configured: {self.cloudfront_domain}")
        except Exception as e:
            logger.error(f"❌ Failed to initialize S3 client: {e}")
            raise
    
    def _generate_unique_filename(self, original_filename: str, folder: str = "uploads") -> str:
        """
        Generate a unique filename to prevent collisions.
        
        Args:
            original_filename: Original file name
            folder: S3 folder prefix (e.g., "billboards/user-id")
            
        Returns:
            Unique filename with folder and timestamp (format: folder/YYYY/MM/uuid.ext)
        """
        # Extract file extension
        extension = original_filename.rsplit('.', 1)[-1].lower()
        
        # Generate unique name: folder/YYYY/MM/uuid.ext
        timestamp = datetime.utcnow()
        year_month = timestamp.strftime("%Y/%m")
        unique_id = str(uuid.uuid4())[:8]
        
        return f"{folder}/{year_month}/{unique_id}.{extension}"
    
    def _validate_file(
        self,
        file_size: int,
        content_type: str,
        allowed_types: List[str],
        max_size_mb: int
    ):
        """
        Validate file before upload.
        
        Args:
            file_size: File size in bytes
            content_type: MIME type
            allowed_types: List of allowed MIME types
            max_size_mb: Maximum file size in MB
            
        Raises:
            BadRequestException: If validation fails
        """
        # Check file size
        max_size_bytes = max_size_mb * 1024 * 1024
        if file_size > max_size_bytes:
            raise BadRequestException(
                detail=f"File size exceeds maximum of {max_size_mb}MB"
            )
        
        # Check content type
        if content_type not in allowed_types:
            raise BadRequestException(
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}"
            )
    
    async def upload_file(
        self,
        file: BinaryIO,
        filename: str,
        content_type: str,
        folder: str = "uploads",
        max_size_mb: int = 10
    ) -> str:
        """
        Upload a file to S3.
        
        Args:
            file: File-like object
            filename: Original filename
            content_type: MIME type
            folder: S3 folder prefix
            max_size_mb: Maximum file size in MB
            
        Returns:
            Public URL of uploaded file
            
        Raises:
            BadRequestException: If validation fails
        """
        try:
            # Read file content
            file_content = file.read()
            file_size = len(file_content)
            
            # Validate file
            allowed_types = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp',
                'image/gif'
            ]
            self._validate_file(file_size, content_type, allowed_types, max_size_mb)
            
            # Generate unique filename with folder prefix
            s3_key = self._generate_unique_filename(filename, folder)
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                CacheControl='max-age=31536000',  # 1 year cache
                Metadata={
                    'uploaded_at': datetime.utcnow().isoformat(),
                    'original_filename': filename
                }
            )
            
            # Generate public URL
            url = self._get_public_url(s3_key)
            
            logger.info(f"✅ File uploaded successfully: {s3_key}")
            return url
        
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(f"❌ S3 upload failed: {error_code} - {e}")
            raise BadRequestException(detail=f"File upload failed: {error_code}")
        
        except BotoCoreError as e:
            logger.error(f"❌ AWS SDK error: {e}")
            raise BadRequestException(detail="File upload failed due to AWS error")
        
        except Exception as e:
            logger.error(f"❌ Unexpected upload error: {e}")
            raise BadRequestException(detail="File upload failed")
    
    async def upload_multiple_files(
        self,
        files: List[tuple],  # List of (file, filename, content_type)
        folder: str = "uploads",
        max_size_mb: int = 10
    ) -> List[str]:
        """
        Upload multiple files to S3.
        
        Args:
            files: List of tuples (file, filename, content_type)
            folder: S3 folder prefix
            max_size_mb: Maximum file size per file in MB
            
        Returns:
            List of public URLs
        """
        urls = []
        
        for file, filename, content_type in files:
            url = await self.upload_file(
                file,
                filename,
                content_type,
                folder,
                max_size_mb
            )
            urls.append(url)
        
        return urls
    
    def generate_presigned_upload_url(
        self,
        filename: str,
        content_type: str,
        folder: str = "uploads",
        expiration: int = 3600
    ) -> dict:
        """
        Generate a pre-signed URL for direct client-side upload.
        
        This is more efficient for large files as it allows the client
        to upload directly to S3 without going through the backend.
        
        Args:
            filename: Original filename
            content_type: MIME type
            folder: S3 folder prefix
            expiration: URL expiration in seconds (default 1 hour)
            
        Returns:
            Dictionary with upload URL and fields
        """
        try:
            # Generate unique filename
            s3_key = self._generate_unique_filename(filename)
            
            # Generate pre-signed POST
            response = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=s3_key,
                Fields={
                    'Content-Type': content_type,
                    'Cache-Control': 'max-age=31536000'
                },
                Conditions=[
                    {'Content-Type': content_type},
                    ['content-length-range', 0, 10 * 1024 * 1024]  # Max 10MB
                ],
                ExpiresIn=expiration
            )
            
            # Add the public URL that will be accessible after upload
            public_url = self._get_public_url(s3_key)
            
            return {
                'upload_url': response['url'],
                'fields': response['fields'],
                'public_url': public_url,
                'key': s3_key,
                'expires_in': expiration
            }
        
        except ClientError as e:
            logger.error(f"❌ Failed to generate pre-signed URL: {e}")
            raise BadRequestException(detail="Failed to generate upload URL")
    
    async def delete_file(self, url: str) -> bool:
        """
        Delete a file from S3.
        
        Args:
            url: Public URL of the file
            
        Returns:
            True if successful
        """
        try:
            # Extract S3 key from URL
            s3_key = self._extract_key_from_url(url)
            
            if not s3_key:
                logger.warning(f"⚠️  Could not extract S3 key from URL: {url}")
                return False
            
            # Delete from S3
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            logger.info(f"✅ File deleted: {s3_key}")
            return True
        
        except ClientError as e:
            logger.error(f"❌ S3 delete failed: {e}")
            return False
    
    async def delete_multiple_files(self, urls: List[str]) -> int:
        """
        Delete multiple files from S3.
        
        Args:
            urls: List of public URLs
            
        Returns:
            Number of successfully deleted files
        """
        deleted_count = 0
        
        for url in urls:
            if await self.delete_file(url):
                deleted_count += 1
        
        return deleted_count
    
    def _get_public_url(self, s3_key: str) -> str:
        """
        Get public URL for an S3 object via CloudFront CDN.
        
        Args:
            s3_key: S3 object key
            
        Returns:
            HTTPS CloudFront CDN URL
        """
        # Return CloudFront URL for CDN delivery
        return f"https://{self.cloudfront_domain}/{s3_key}"
    
    def _extract_key_from_url(self, url: str) -> Optional[str]:
        """
        Extract S3 key from public URL (CloudFront or legacy S3).
        
        Args:
            url: Public URL (CloudFront or direct S3)
            
        Returns:
            S3 key or None
        """
        try:
            # Remove protocol if present
            url_path = url.replace('https://', '').replace('http://', '')
            
            # Extract from CloudFront URL (primary)
            if self.cloudfront_domain in url_path:
                return url_path.split(self.cloudfront_domain + '/')[-1]
            
            # Extract from legacy S3 URL (backwards compatibility)
            elif self.bucket_name in url_path:
                return url_path.split('.amazonaws.com/')[-1]
            
            else:
                logger.warning(f"⚠️  Unknown URL format: {url}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error extracting S3 key: {e}")
            return None
    
    async def check_file_exists(self, url: str) -> bool:
        """
        Check if a file exists in S3.
        
        Args:
            url: Public URL of the file
            
        Returns:
            True if file exists
        """
        try:
            s3_key = self._extract_key_from_url(url)
            
            if not s3_key:
                return False
            
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return True
        
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            logger.error(f"❌ Error checking file existence: {e}")
            return False


s3_client = S3Client()
