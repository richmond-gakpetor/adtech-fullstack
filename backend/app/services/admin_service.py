"""Admin service for platform management"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from typing import Optional, Dict, Any
import uuid
from datetime import datetime

from app.models.user import User, UserType
from app.models.billboard import Billboard
from app.models.review import Review
from app.models.payment import Payment
from app.schemas.admin import (
    AdminUserResponse,
    AdminUserListResponse,
    AdminStatsResponse,
    UserStatusUpdate,
    UserTypeChangeRequest
)
from app.core.exceptions import (
    NotFoundException,
    BadRequestException,
    ForbiddenException
)


class AdminService:
    """Service for admin operations"""
    
    @staticmethod
    async def get_platform_stats(db: AsyncSession) -> AdminStatsResponse:
        """
        Get platform-wide statistics
        
        Args:
            db: Database session
            
        Returns:
            Platform statistics
        """
        # Count users by type
        total_users_stmt = select(func.count(User.id))
        total_users = (await db.execute(total_users_stmt)).scalar_one()
        
        active_users_stmt = select(func.count(User.id)).where(User.is_active == True)
        active_users = (await db.execute(active_users_stmt)).scalar_one()
        
        owners_stmt = select(func.count(User.id)).where(User.user_type == UserType.OWNER)
        total_owners = (await db.execute(owners_stmt)).scalar_one()
        
        advertisers_stmt = select(func.count(User.id)).where(User.user_type == UserType.ADVERTISER)
        total_advertisers = (await db.execute(advertisers_stmt)).scalar_one()
        
        admins_stmt = select(func.count(User.id)).where(User.user_type == UserType.ADMIN)
        total_admins = (await db.execute(admins_stmt)).scalar_one()
        
        # Count billboards
        total_billboards_stmt = select(func.count(Billboard.id))
        total_billboards = (await db.execute(total_billboards_stmt)).scalar_one()
        
        active_billboards_stmt = select(func.count(Billboard.id)).where(
            Billboard.is_active == True
        )
        active_billboards = (await db.execute(active_billboards_stmt)).scalar_one()
        
        # Count reviews
        total_reviews_stmt = select(func.count(Review.id))
        total_reviews = (await db.execute(total_reviews_stmt)).scalar_one()
        
        # Count payments and revenue
        total_payments_stmt = select(func.count(Payment.id))
        total_payments = (await db.execute(total_payments_stmt)).scalar_one()
        
        revenue_stmt = select(func.sum(Payment.amount_pesewas)).where(
            Payment.status == "completed"  # Use string instead of enum
        )
        total_revenue_pesewas = (await db.execute(revenue_stmt)).scalar_one() or 0
        total_revenue = total_revenue_pesewas / 100  # Convert to GHS
        
        return AdminStatsResponse(
            total_users=total_users,
            active_users=active_users,
            total_owners=total_owners,
            total_advertisers=total_advertisers,
            total_admins=total_admins,
            total_billboards=total_billboards,
            active_billboards=active_billboards,
            total_reviews=total_reviews,
            total_payments=total_payments,
            total_revenue_ghs=float(total_revenue)
        )
    
    @staticmethod
    async def get_users(
        db: AsyncSession,
        user_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_verified: Optional[bool] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> AdminUserListResponse:
        """
        Get paginated list of users with filters
        
        Args:
            db: Database session
            user_type: Filter by user type
            is_active: Filter by active status
            is_verified: Filter by verified status
            search: Search in email, first name, last name
            page: Page number
            page_size: Items per page
            
        Returns:
            Paginated user list
        """
        # Build query
        query = select(User)
        conditions = []
        
        if user_type:
            conditions.append(User.user_type == user_type)
        if is_active is not None:
            conditions.append(User.is_active == is_active)
        if is_verified is not None:
            conditions.append(User.is_verified == is_verified)
        if search:
            search_pattern = f"%{search}%"
            conditions.append(
                (User.email.ilike(search_pattern)) |
                (User.first_name.ilike(search_pattern)) |
                (User.last_name.ilike(search_pattern))
            )
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(count_query)).scalar_one()
        
        # Apply pagination
        query = query.order_by(desc(User.created_at))
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(query)
        users = result.scalars().all()
        
        # Build responses with statistics
        user_responses = []
        for user in users:
            # Get billboard count
            billboard_count_stmt = select(func.count(Billboard.id)).where(
                Billboard.owner_id == user.id
            )
            billboard_count = (await db.execute(billboard_count_stmt)).scalar_one()
            
            # Get review count (as reviewer)
            review_count_stmt = select(func.count(Review.id)).where(
                Review.reviewer_id == user.id
            )
            review_count = (await db.execute(review_count_stmt)).scalar_one()
            
            user_responses.append(
                AdminUserResponse(
                    id=str(user.id),
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    phone_number=user.phone_number,
                    user_type=user.user_type,
                    is_active=user.is_active,
                    is_verified=user.is_verified,
                    created_at=user.created_at,
                    updated_at=user.updated_at,
                    # Email verification
                    email_verified=user.email_verified,
                    email_verified_at=user.email_verified_at,
                    # KYC fields
                    kyc_status=user.kyc_status,
                    kyc_submission_count=user.kyc_submission_count,
                    kyc_submitted_at=user.kyc_submitted_at,
                    kyc_reviewed_at=user.kyc_reviewed_at,
                    kyc_rejection_reason=user.kyc_rejection_reason,
                    # Statistics
                    billboard_count=billboard_count,
                    review_count=review_count
                )
            )
        
        total_pages = (total + page_size - 1) // page_size
        
        return AdminUserListResponse(
            users=user_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    
    @staticmethod
    async def get_user_by_id(
        db: AsyncSession,
        user_id: uuid.UUID
    ) -> AdminUserResponse:
        """
        Get detailed user information
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User details with statistics
        """
        # Get user
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise NotFoundException(detail="User not found")
        
        # Get statistics
        billboard_count_stmt = select(func.count(Billboard.id)).where(
            Billboard.owner_id == user.id
        )
        billboard_count = (await db.execute(billboard_count_stmt)).scalar_one()
        
        review_count_stmt = select(func.count(Review.id)).where(
            Review.reviewer_id == user.id
        )
        review_count = (await db.execute(review_count_stmt)).scalar_one()
        
        return AdminUserResponse(
            id=str(user.id),
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone_number=user.phone_number,
            user_type=user.user_type,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            updated_at=user.updated_at,
            # Email verification
            email_verified=user.email_verified,
            email_verified_at=user.email_verified_at,
            # KYC fields
            kyc_status=user.kyc_status,
            kyc_submission_count=user.kyc_submission_count,
            kyc_submitted_at=user.kyc_submitted_at,
            kyc_reviewed_at=user.kyc_reviewed_at,
            kyc_rejection_reason=user.kyc_rejection_reason,
            # Statistics
            billboard_count=billboard_count,
            review_count=review_count
        )
    
    @staticmethod
    async def update_user_status(
        db: AsyncSession,
        user_id: uuid.UUID,
        status_update: UserStatusUpdate
    ) -> AdminUserResponse:
        """
        Update user status (active/verified)
        
        Args:
            db: Database session
            user_id: User ID to update
            status_update: Status update data
            
        Returns:
            Updated user
        """
        # Get user
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise NotFoundException(detail="User not found")
        
        # Update status
        if status_update.is_active is not None:
            user.is_active = status_update.is_active
        if status_update.is_verified is not None:
            user.is_verified = status_update.is_verified
        
        await db.commit()
        await db.refresh(user)
        
        return await AdminService.get_user_by_id(db, user_id)
    
    @staticmethod
    async def change_user_type(
        db: AsyncSession,
        user_id: uuid.UUID,
        type_change: UserTypeChangeRequest
    ) -> AdminUserResponse:
        """
        Change user type (owner/advertiser/admin)
        
        Args:
            db: Database session
            user_id: User ID to update
            type_change: New user type
            
        Returns:
            Updated user
        """
        # Get user
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise NotFoundException(detail="User not found")
        
        # Update user type
        user.user_type = type_change.user_type
        
        await db.commit()
        await db.refresh(user)
        
        return await AdminService.get_user_by_id(db, user_id)
    
    @staticmethod
    async def delete_user(
        db: AsyncSession,
        user_id: uuid.UUID
    ) -> Dict[str, str]:
        """
        Delete a user (soft delete by deactivating)
        
        Args:
            db: Database session
            user_id: User ID to delete
            
        Returns:
            Success message
        """
        # Get user
        user_stmt = select(User).where(User.id == user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise NotFoundException(detail="User not found")
        
        # Prevent deleting admins
        if user.user_type == UserType.ADMIN:
            raise BadRequestException(detail="Cannot delete admin users")
        
        # Soft delete (deactivate)
        user.is_active = False
        
        await db.commit()
        
        return {"message": "User deactivated successfully"}


# Global service instance
admin_service = AdminService()
