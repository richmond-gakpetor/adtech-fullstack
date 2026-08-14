"""Review service for handling review operations"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from typing import Optional, Dict, Any
import uuid

from app.models.review import Review, ReviewType
from app.models.user import User
from app.models.billboard import Billboard
from app.schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewListResponse,
    ReviewerInfo
)
from app.core.exceptions import (
    NotFoundException,
    BadRequestException,
    ForbiddenException
)
from app.services.email_service import email_service


class ReviewService:
    """Service for review operations"""
    
    @staticmethod
    async def create_review(
        db: AsyncSession,
        user_id: uuid.UUID,
        review_data: ReviewCreate
    ) -> ReviewResponse:
        """
        Create a new review
        
        Args:
            db: Database session
            user_id: User creating the review
            review_data: Review data
            
        Returns:
            Created review response
        """
        # Validate review type specific requirements
        if review_data.review_type == ReviewType.BILLBOARD:
            if not review_data.billboard_id:
                raise BadRequestException(detail="billboard_id is required for billboard reviews")
            
            # Verify billboard exists
            billboard_stmt = select(Billboard).where(Billboard.id == uuid.UUID(review_data.billboard_id))
            billboard_result = await db.execute(billboard_stmt)
            billboard = billboard_result.scalar_one_or_none()
            
            if not billboard:
                raise NotFoundException(detail="Billboard not found")
            
            # Set reviewee_id to billboard owner
            reviewee_id = billboard.owner_id
            billboard_id = billboard.id
            
        elif review_data.review_type in [ReviewType.OWNER, ReviewType.ADVERTISER]:
            if not review_data.reviewee_id:
                raise BadRequestException(detail=f"reviewee_id is required for {review_data.review_type.value} reviews")
            
            # Verify reviewee exists
            reviewee_stmt = select(User).where(User.id == uuid.UUID(review_data.reviewee_id))
            reviewee_result = await db.execute(reviewee_stmt)
            reviewee = reviewee_result.scalar_one_or_none()
            
            if not reviewee:
                raise NotFoundException(detail="Reviewee not found")
            
            reviewee_id = reviewee.id
            billboard_id = uuid.UUID(review_data.billboard_id) if review_data.billboard_id else None
        else:
            raise BadRequestException(detail="Invalid review type")
        
        # Check if user already reviewed this entity
        existing_review_stmt = select(Review).where(
            and_(
                Review.reviewer_id == user_id,
                Review.review_type == review_data.review_type,
                or_(
                    Review.billboard_id == billboard_id if billboard_id else False,
                    Review.reviewee_id == reviewee_id if reviewee_id else False
                )
            )
        )
        existing_review_result = await db.execute(existing_review_stmt)
        existing_review = existing_review_result.scalar_one_or_none()
        
        if existing_review:
            raise BadRequestException(detail="You have already reviewed this entity")
        
        # Prevent self-review
        if reviewee_id == user_id:
            raise BadRequestException(detail="You cannot review yourself")
        
        # Create review
        review = Review(
            id=uuid.uuid4(),
            reviewer_id=user_id,
            reviewee_id=reviewee_id,
            billboard_id=billboard_id,
            review_type=review_data.review_type,
            rating=review_data.rating,
            title=review_data.title,
            comment=review_data.comment,
            campaign_name=review_data.campaign_name,
            is_verified=False,  # Can be verified later by admin
            is_visible=True,
            helpful_count=0
        )
        
        db.add(review)
        await db.commit()
        await db.refresh(review)
        
        # Send email notification (non-blocking)
        try:
            await email_service.send_review_notification_email(db, review.id)
        except Exception as e:
            # Don't fail review creation if email fails
            print(f"Failed to send review notification email: {str(e)}")
        
        return await ReviewService._build_review_response(db, review)
    
    @staticmethod
    async def update_review(
        db: AsyncSession,
        review_id: uuid.UUID,
        user_id: uuid.UUID,
        review_data: ReviewUpdate
    ) -> ReviewResponse:
        """
        Update an existing review
        
        Args:
            db: Database session
            review_id: Review ID to update
            user_id: User updating the review
            review_data: Updated review data
            
        Returns:
            Updated review response
        """
        # Get review
        review_stmt = select(Review).where(Review.id == review_id)
        review_result = await db.execute(review_stmt)
        review = review_result.scalar_one_or_none()
        
        if not review:
            raise NotFoundException(detail="Review not found")
        
        # Verify ownership
        if review.reviewer_id != user_id:
            raise ForbiddenException(detail="You can only update your own reviews")
        
        # Update fields
        if review_data.rating is not None:
            review.rating = review_data.rating
        if review_data.title is not None:
            review.title = review_data.title
        if review_data.comment is not None:
            review.comment = review_data.comment
        if review_data.campaign_name is not None:
            review.campaign_name = review_data.campaign_name
        
        await db.commit()
        await db.refresh(review)
        
        return await ReviewService._build_review_response(db, review)
    
    @staticmethod
    async def delete_review(
        db: AsyncSession,
        review_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """
        Delete a review
        
        Args:
            db: Database session
            review_id: Review ID to delete
            user_id: User deleting the review
            
        Returns:
            True if deleted successfully
        """
        # Get review
        review_stmt = select(Review).where(Review.id == review_id)
        review_result = await db.execute(review_stmt)
        review = review_result.scalar_one_or_none()
        
        if not review:
            raise NotFoundException(detail="Review not found")
        
        # Verify ownership
        if review.reviewer_id != user_id:
            raise ForbiddenException(detail="You can only delete your own reviews")
        
        await db.delete(review)
        await db.commit()
        
        return True
    
    @staticmethod
    async def get_reviews(
        db: AsyncSession,
        review_type: Optional[ReviewType] = None,
        billboard_id: Optional[uuid.UUID] = None,
        reviewee_id: Optional[uuid.UUID] = None,
        min_rating: Optional[int] = None,
        page: int = 1,
        page_size: int = 20
    ) -> ReviewListResponse:
        """
        Get reviews with filters
        
        Args:
            db: Database session
            review_type: Filter by review type
            billboard_id: Filter by billboard
            reviewee_id: Filter by reviewee
            min_rating: Minimum rating filter
            page: Page number
            page_size: Items per page
            
        Returns:
            Paginated review list
        """
        # Build query
        query = select(Review).where(Review.is_visible == True)
        
        if review_type:
            query = query.where(Review.review_type == review_type)
        if billboard_id:
            query = query.where(Review.billboard_id == billboard_id)
        if reviewee_id:
            query = query.where(Review.reviewee_id == reviewee_id)
        if min_rating:
            query = query.where(Review.rating >= min_rating)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Calculate average rating
        avg_query = select(func.avg(Review.rating)).select_from(query.subquery())
        avg_result = await db.execute(avg_query)
        average_rating = avg_result.scalar()
        
        # Get paginated reviews
        offset = (page - 1) * page_size
        query = query.order_by(desc(Review.created_at)).limit(page_size).offset(offset)
        
        reviews_result = await db.execute(query)
        reviews = reviews_result.scalars().all()
        
        # Build responses
        review_responses = []
        for review in reviews:
            review_response = await ReviewService._build_review_response(db, review)
            review_responses.append(review_response)
        
        return ReviewListResponse(
            reviews=review_responses,
            total=total,
            page=page,
            page_size=page_size,
            average_rating=float(average_rating) if average_rating else None
        )
    
    @staticmethod
    async def mark_review_helpful(
        db: AsyncSession,
        review_id: uuid.UUID
    ) -> int:
        """
        Mark a review as helpful
        
        Args:
            db: Database session
            review_id: Review ID
            
        Returns:
            Updated helpful count
        """
        # Get review
        review_stmt = select(Review).where(Review.id == review_id)
        review_result = await db.execute(review_stmt)
        review = review_result.scalar_one_or_none()
        
        if not review:
            raise NotFoundException(detail="Review not found")
        
        # Increment helpful count
        review.helpful_count += 1
        await db.commit()
        await db.refresh(review)
        
        return review.helpful_count
    
    @staticmethod
    async def _build_review_response(db: AsyncSession, review: Review) -> ReviewResponse:
        """Build review response with related data"""
        # Get reviewer info
        reviewer_stmt = select(User).where(User.id == review.reviewer_id)
        reviewer_result = await db.execute(reviewer_stmt)
        reviewer = reviewer_result.scalar_one()
        
        reviewer_info = ReviewerInfo(
            id=str(reviewer.id),
            name=reviewer.full_name,
            company=None,  # company_name field removed from User model
            user_type=reviewer.user_type,
            is_verified=reviewer.is_verified
        )
        
        return ReviewResponse(
            id=str(review.id),
            review_type=review.review_type,
            rating=review.rating,
            title=review.title,
            comment=review.comment,
            campaign_name=review.campaign_name,
            is_verified=review.is_verified,
            is_visible=review.is_visible,
            helpful_count=review.helpful_count,
            created_at=review.created_at,
            updated_at=review.updated_at,
            reviewer=reviewer_info,
            reviewee_id=str(review.reviewee_id) if review.reviewee_id else None,
            billboard_id=str(review.billboard_id) if review.billboard_id else None
        )


# Global review service instance
review_service = ReviewService()
