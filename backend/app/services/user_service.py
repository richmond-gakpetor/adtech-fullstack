from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
from app.models.user import User, UserType, KYCStatus
from app.schemas.user import UserCreate, UserUpdate, PasswordChange
from app.core.security import hash_password, verify_password
from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    BadRequestException,
    UnauthorizedException
)
from app.config import settings
from app.services.email_service import EmailService


class UserService:
    """Service class for user-related operations"""
    
    @staticmethod
    async def create_user(
        db: AsyncSession,
        user_data: UserCreate
    ) -> User:
        """
        Create a new user account.
        
        Args:
            db: Database session
            user_data: User registration data
            
        Returns:
            Created user
            
        Raises:
            ConflictException: If email already exists
        """
        # Check if email already exists
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise ConflictException(detail="Email already registered")
        
        # Create user
        user = User(
            email=user_data.email,
            password_hash=hash_password(user_data.password),
            user_type=user_data.user_type,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone_number=user_data.phone_number,
        )
        
        db.add(user)
        await db.flush()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        email: str,
        password: str
    ) -> User:
        """
        Authenticate a user with email and password.
        
        Args:
            db: Database session
            email: User email
            password: Plain text password
            
        Returns:
            Authenticated user
            
        Raises:
            UnauthorizedException: If credentials are invalid
        """
        result = await db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise UnauthorizedException(detail="Invalid email or password")
        
        if not verify_password(password, user.password_hash):
            raise UnauthorizedException(detail="Invalid email or password")
        
        if not user.is_active:
            raise UnauthorizedException(detail="User account is inactive")
        
        return user
    
    @staticmethod
    async def get_user_by_id(
        db: AsyncSession,
        user_id: UUID
    ) -> User:
        """
        Get user by ID.
        
        Args:
            db: Database session
            user_id: User UUID
            
        Returns:
            User object
            
        Raises:
            NotFoundException: If user not found
        """
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise NotFoundException(detail="User not found")
        
        return user
    
    @staticmethod
    async def get_user_by_email(
        db: AsyncSession,
        email: str
    ) -> Optional[User]:
        """
        Get user by email.
        
        Args:
            db: Database session
            email: User email
            
        Returns:
            User object or None if not found
        """
        result = await db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def update_user(
        db: AsyncSession,
        user: User,
        user_data: UserUpdate
    ) -> User:
        """
        Update user profile.
        
        Args:
            db: Database session
            user: User to update
            user_data: Update data
            
        Returns:
            Updated user
        """
        update_data = user_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await db.flush()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def change_password(
        db: AsyncSession,
        user: User,
        password_data: PasswordChange
    ) -> None:
        """
        Change user password.
        
        Args:
            db: Database session
            user: User whose password to change
            password_data: Password change data
            
        Raises:
            BadRequestException: If current password is incorrect
        """
        # Verify current password
        if not verify_password(password_data.current_password, user.password_hash):
            raise BadRequestException(detail="Current password is incorrect")
        
        # Update password
        user.password_hash = hash_password(password_data.new_password)
        await db.flush()
    
    @staticmethod
    async def reset_password(
        db: AsyncSession,
        email: str,
        new_password: str
    ) -> None:
        """
        Reset user password (used with password reset token).
        
        Args:
            db: Database session
            email: User email
            new_password: New plain text password
            
        Raises:
            NotFoundException: If user not found
        """
        user = await UserService.get_user_by_email(db, email)
        
        if not user:
            raise NotFoundException(detail="User not found")
        
        user.password_hash = hash_password(new_password)
        await db.flush()
    
    @staticmethod
    async def verify_user(
        db: AsyncSession,
        user_id: UUID
    ) -> User:
        """
        Mark user as verified.
        
        Args:
            db: Database session
            user_id: User UUID
            
        Returns:
            Verified user
        """
        user = await UserService.get_user_by_id(db, user_id)
        user.is_verified = True
        await db.flush()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def deactivate_user(
        db: AsyncSession,
        user_id: UUID
    ) -> User:
        """
        Deactivate user account.
        
        Args:
            db: Database session
            user_id: User UUID
            
        Returns:
            Deactivated user
        """
        user = await UserService.get_user_by_id(db, user_id)
        user.is_active = False
        await db.flush()
        await db.refresh(user)
        
        return user    
    # ============= Email Verification Methods =============
    
    @staticmethod
    async def generate_email_verification_token(
        db: AsyncSession,
        user_id: UUID
    ) -> str:
        """
        Generate and store email verification token for user.
        
        Args:
            db: Database session
            user_id: User UUID
            
        Returns:
            Verification token string
        """
        user = await UserService.get_user_by_id(db, user_id)
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Set token and expiry
        user.email_verification_token = token
        user.email_verification_token_expires = datetime.utcnow() + timedelta(
            hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS
        )
        
        await db.flush()
        return token
    
    @staticmethod
    async def verify_email(
        db: AsyncSession,
        token: str
    ) -> User:
        """
        Verify user email with token.
        
        Args:
            db: Database session
            token: Verification token
            
        Returns:
            Verified user
            
        Raises:
            BadRequestException: If token is invalid or expired
        """
        result = await db.execute(
            select(User).where(User.email_verification_token == token)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise BadRequestException(detail="Invalid verification token")
        
        if user.email_verification_token_expires < datetime.utcnow():
            raise BadRequestException(detail="Verification token has expired")
        
        if user.email_verified:
            raise BadRequestException(detail="Email already verified")
        
        # Mark as verified
        user.email_verified = True
        user.email_verified_at = datetime.utcnow()
        user.email_verification_token = None
        user.email_verification_token_expires = None
        
        await db.flush()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    async def resend_verification_email(
        db: AsyncSession,
        email: str
    ) -> bool:
        """
        Resend verification email to user.
        
        Args:
            db: Database session
            email: User email address
            
        Returns:
            True if email sent successfully
            
        Raises:
            BadRequestException: If email already verified
        """
        user = await UserService.get_user_by_email(db, email)
        
        if user.email_verified:
            raise BadRequestException(detail="Email already verified")
        
        # Generate new token
        token = await UserService.generate_email_verification_token(db, user.id)
        await db.commit()
        
        # Send email
        return await EmailService.send_email_verification(
            user_email=user.email,
            user_name=user.first_name,
            user_type=user.user_type,
            verification_token=token
        )
    
    # ============= KYC Verification Methods =============
    
    @staticmethod
    async def submit_kyc(
        db: AsyncSession,
        user_id: UUID,
        notes: Optional[str] = None
    ) -> User:
        """
        Mark KYC as submitted by user.
        
        Args:
            db: Database session
            user_id: User UUID
            notes: Optional notes from user
            
        Returns:
            Updated user
            
        Raises:
            BadRequestException: If user is not owner or KYC already under review
        """
        user = await UserService.get_user_by_id(db, user_id)
        
        if user.user_type != UserType.OWNER.value:
            raise BadRequestException(detail="KYC verification is only required for billboard owners")
        
        if user.kyc_status == KYCStatus.SUBMITTED.value:
            raise BadRequestException(detail="KYC submission already under review")
        
        if user.kyc_status == KYCStatus.APPROVED.value:
            raise BadRequestException(detail="KYC already approved")
        
        # Update KYC status
        user.kyc_status = KYCStatus.SUBMITTED.value
        user.kyc_submitted_at = datetime.utcnow()
        user.kyc_submission_count += 1
        user.kyc_rejection_reason = None  # Clear previous rejection
        
        await db.flush()
        await db.refresh(user)
        
        return user

    @staticmethod
    async def admin_mark_kyc_submitted(
        db: AsyncSession,
        user_id: UUID,
        admin_notes: Optional[str] = None
    ) -> User:
        """
        Admin override: forcefully mark a user's KYC as submitted so it appears
        in the review queue. Use when a user completed the external Google Form
        but did not return to the platform to confirm their submission.

        Args:
            db: Database session
            user_id: User UUID
            admin_notes: Optional internal note recorded by the admin

        Returns:
            Updated user

        Raises:
            BadRequestException: If user is not an owner or KYC is already approved
        """
        user = await UserService.get_user_by_id(db, user_id)

        if user.user_type != UserType.OWNER.value:
            raise BadRequestException(detail="KYC verification is only required for billboard owners")

        if user.kyc_status == KYCStatus.APPROVED.value:
            raise BadRequestException(detail="KYC already approved — no action needed")

        user.kyc_status = KYCStatus.SUBMITTED.value
        user.kyc_submitted_at = datetime.utcnow()
        user.kyc_submission_count += 1
        user.kyc_rejection_reason = None

        await db.flush()
        await db.refresh(user)

        return user

    @staticmethod
    async def review_kyc(
        db: AsyncSession,
        user_id: UUID,
        approved: bool,
        admin_id: UUID,
        rejection_reason: Optional[str] = None,
        notes: Optional[str] = None
    ) -> User:
        """
        Review and approve/reject user KYC (admin only).
        
        Args:
            db: Database session
            user_id: User UUID
            approved: Whether to approve KYC
            admin_id: Admin user ID performing the review
            rejection_reason: Reason for rejection (required if not approved)
            notes: Internal notes about the review
            
        Returns:
            Updated user
            
        Raises:
            BadRequestException: If KYC not submitted or validation fails
        """
        user = await UserService.get_user_by_id(db, user_id)
        
        if user.kyc_status != KYCStatus.SUBMITTED.value:
            raise BadRequestException(detail="KYC must be submitted before review")
        
        if not approved and not rejection_reason:
            raise BadRequestException(detail="Rejection reason is required when rejecting KYC")
        
        # Update KYC status
        user.kyc_status = KYCStatus.APPROVED.value if approved else KYCStatus.REJECTED.value
        user.kyc_reviewed_at = datetime.utcnow()
        user.kyc_reviewed_by_id = admin_id
        user.kyc_rejection_reason = rejection_reason if not approved else None
        
        await db.flush()
        await db.refresh(user)
        await db.commit()
        
        # Send notification email
        await EmailService.send_kyc_status_email(
            user_email=user.email,
            user_name=user.first_name,
            approved=approved,
            rejection_reason=rejection_reason
        )
        
        return user
    
    @staticmethod
    async def get_kyc_form_url(args: any) -> str:
        """
        Generate KYC Google Form URL with prefilled email.
        
        Args:
            user_email: User's email address
            
        Returns:
            Google Form URL with prefilled email
        """
        # Note: Replace entry.XXXXXX with actual entry ID from your Google Form
        base_url = settings.KYC_GOOGLE_FORM_URL
        # Example: entry.123456789 would be the field ID for email in your form
        return base_url