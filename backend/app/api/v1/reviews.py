"""Review API endpoints"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.api.v1.deps import get_db, get_current_user
from app.models.user import User
from app.models.review import ReviewType
from app.schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewListResponse,
    MarkReviewHelpfulResponse
)
from app.schemas.common import APIResponse
from app.services.review_service import review_service


router = APIRouter()


@router.post("", response_model=APIResponse[ReviewResponse])
async def create_review(
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new review
    
    Reviews can be for:
    - Billboards (requires billboard_id)
    - Owners (requires reviewee_id)
    - Advertisers (requires reviewee_id)
    """
    review = await review_service.create_review(
        db=db,
        user_id=current_user.id,
        review_data=review_data
    )
    
    return APIResponse(
        success=True,
        data=review,
        message="Review created successfully"
    )


@router.put("/{review_id}", response_model=APIResponse[ReviewResponse])
async def update_review(
    review_id: str,
    review_data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing review
    
    Only the review creator can update their review.
    """
    review = await review_service.update_review(
        db=db,
        review_id=uuid.UUID(review_id),
        user_id=current_user.id,
        review_data=review_data
    )
    
    return APIResponse(
        success=True,
        data=review,
        message="Review updated successfully"
    )


@router.delete("/{review_id}", response_model=APIResponse[dict])
async def delete_review(
    review_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a review
    
    Only the review creator can delete their review.
    """
    await review_service.delete_review(
        db=db,
        review_id=uuid.UUID(review_id),
        user_id=current_user.id
    )
    
    return APIResponse(
        success=True,
        data={"deleted": True},
        message="Review deleted successfully"
    )


@router.get("", response_model=APIResponse[ReviewListResponse])
async def get_reviews(
    review_type: Optional[ReviewType] = Query(None, description="Filter by review type"),
    billboard_id: Optional[str] = Query(None, description="Filter by billboard ID"),
    reviewee_id: Optional[str] = Query(None, description="Filter by reviewee (user) ID"),
    min_rating: Optional[int] = Query(None, ge=1, le=5, description="Minimum rating filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get reviews with optional filters
    
    Filters:
    - review_type: billboard, owner, or advertiser
    - billboard_id: Get reviews for a specific billboard
    - reviewee_id: Get reviews for a specific user (owner or advertiser)
    - min_rating: Minimum star rating (1-5)
    """
    reviews = await review_service.get_reviews(
        db=db,
        review_type=review_type,
        billboard_id=uuid.UUID(billboard_id) if billboard_id else None,
        reviewee_id=uuid.UUID(reviewee_id) if reviewee_id else None,
        min_rating=min_rating,
        page=page,
        page_size=page_size
    )
    
    return APIResponse(
        success=True,
        data=reviews,
        message="Reviews retrieved successfully"
    )


@router.post("/{review_id}/helpful", response_model=APIResponse[MarkReviewHelpfulResponse])
async def mark_review_helpful(
    review_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a review as helpful
    
    Increments the helpful count for the review.
    No authentication required to mark reviews as helpful.
    """
    helpful_count = await review_service.mark_review_helpful(
        db=db,
        review_id=uuid.UUID(review_id)
    )
    
    return APIResponse(
        success=True,
        data=MarkReviewHelpfulResponse(
            success=True,
            helpful_count=helpful_count
        ),
        message="Review marked as helpful"
    )


@router.get("/billboard/{billboard_id}/summary", response_model=APIResponse[dict])
async def get_billboard_review_summary(
    billboard_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get review summary for a billboard
    
    Returns:
    - Average rating
    - Total review count
    - Rating distribution (1-5 stars)
    """
    reviews = await review_service.get_reviews(
        db=db,
        review_type=ReviewType.BILLBOARD,
        billboard_id=uuid.UUID(billboard_id),
        page=1,
        page_size=1000  # Get all reviews for summary
    )
    
    # Calculate rating distribution
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for review in reviews.reviews:
        rating_distribution[review.rating] += 1
    
    summary = {
        "average_rating": reviews.average_rating,
        "total_reviews": reviews.total,
        "rating_distribution": rating_distribution
    }
    
    return APIResponse(
        success=True,
        data=summary,
        message="Billboard review summary retrieved"
    )


@router.get("/user/{user_id}/summary", response_model=APIResponse[dict])
async def get_user_review_summary(
    user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get review summary for a user (owner or advertiser)
    
    Returns:
    - Average rating
    - Total review count
    - Rating distribution (1-5 stars)
    """
    reviews = await review_service.get_reviews(
        db=db,
        reviewee_id=uuid.UUID(user_id),
        page=1,
        page_size=1000  # Get all reviews for summary
    )
    
    # Calculate rating distribution
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for review in reviews.reviews:
        rating_distribution[review.rating] += 1
    
    summary = {
        "average_rating": reviews.average_rating,
        "total_reviews": reviews.total,
        "rating_distribution": rating_distribution
    }
    
    return APIResponse(
        success=True,
        data=summary,
        message="User review summary retrieved"
    )
