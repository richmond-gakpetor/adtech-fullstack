"""Visibility service for time-based listing visibility logic"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, update
from uuid import UUID

from app.core.database import AsyncSessionLocal
from app.models.billboard import Billboard
from app.models.payment import BillboardListingPayment
from app.config import settings

logger = logging.getLogger(__name__)


class VisibilityService:
    """
    Service for determining billboard visibility based on time windows.
    
    Follows rubric principle: "Is this listing allowed to be visible right now?"
    - Visibility is determined by time windows, not boolean states
    - Backend is the authority on visibility
    - Expiration is expected, not exceptional
    """
    
    @staticmethod
    async def is_billboard_visible(
        db: AsyncSession,
        billboard_id: UUID,
        check_time: Optional[datetime] = None
    ) -> bool:
        """
        Determine if a billboard is currently visible to advertisers.
        
        Args:
            db: Database session
            billboard_id: Billboard UUID
            check_time: Time to check visibility (defaults to now)
            
        Returns:
            True if billboard should be visible, False otherwise
        """
        if check_time is None:
            check_time = datetime.now(timezone.utc)
        
        # Get the most recent listing payment for this billboard
        latest_payment = await VisibilityService.get_latest_listing_payment(
            db, billboard_id
        )
        
        if not latest_payment:
            return False  # No visibility granted
        
        # Guard: payment not yet activated (access_expires_at is None for pending payments)
        if latest_payment.access_expires_at is None:
            return False
        
        # Check if within visibility window (including grace period)
        grace_end = latest_payment.access_expires_at + timedelta(
            days=settings.LISTING_GRACE_DAYS
        )
        
        return check_time < grace_end
    
    @staticmethod
    async def get_latest_listing_payment(
        db: AsyncSession,
        billboard_id: UUID
    ) -> Optional[BillboardListingPayment]:
        """
        Get the most recent listing payment for a billboard.
        
        This determines the current visibility window.
        Multiple payments = renewals/extensions.
        """
        stmt = (
            select(BillboardListingPayment)
            .where(BillboardListingPayment.billboard_id == billboard_id)
            .order_by(desc(BillboardListingPayment.access_expires_at))
            .limit(1)
        )
        
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_visibility_window(
        db: AsyncSession,
        billboard_id: UUID
    ) -> Optional[dict]:
        """
        Get the visibility window details for a billboard.
        
        Returns:
            Dict with starts_at, expires_at, grace_ends_at, is_visible
            None if no visibility granted
        """
        latest_payment = await VisibilityService.get_latest_listing_payment(
            db, billboard_id
        )
        
        if not latest_payment:
            return None
        
        # Guard: payment not yet activated
        if latest_payment.access_expires_at is None:
            return None
        
        now = datetime.now(timezone.utc)
        grace_end = latest_payment.access_expires_at + timedelta(
            days=settings.LISTING_GRACE_DAYS
        )
        
        return {
            "starts_at": latest_payment.access_starts_at,
            "expires_at": latest_payment.access_expires_at,
            "grace_ends_at": grace_end,
            "is_visible": now < grace_end,
            "is_in_grace_period": latest_payment.access_expires_at < now < grace_end,
            "days_remaining": (latest_payment.access_expires_at - now).days if now < latest_payment.access_expires_at else 0
        }
    
    @staticmethod
    async def increment_active_billboard_views() -> dict:
        """
        Increment the views counter by 25 for every currently visible billboard.
        Visibility is determined by an active BillboardListingPayment time window
        (including grace period), not the legacy is_active flag.
        Runs as a scheduled task.

        Returns:
            Dict with the number of billboards updated.
        """
        logger.info("Starting billboard views increment...")
        try:
            async with AsyncSessionLocal() as db:
                # Use naive UTC to match TIMESTAMP WITHOUT TIME ZONE columns in the DB
                now = datetime.utcnow()
                # Include grace period: a billboard is still visible until
                # access_expires_at + LISTING_GRACE_DAYS
                grace_cutoff = now - timedelta(days=settings.LISTING_GRACE_DAYS)

                # Subquery: IDs of billboards with a non-expired listing payment
                visible_ids = (
                    select(BillboardListingPayment.billboard_id)
                    .where(BillboardListingPayment.access_expires_at > grace_cutoff)
                )

                result = await db.execute(
                    update(Billboard)
                    .where(Billboard.id.in_(visible_ids))
                    .values(views=Billboard.views + 25)
                )
                await db.commit()
                updated = result.rowcount

            logger.info(f"Billboard views increment complete. Billboards updated: {updated}")
            return {"billboards_updated": updated}

        except Exception as e:
            logger.error(f"Error in billboard views increment: {str(e)}", exc_info=True)
            return {"billboards_updated": 0}

    @staticmethod
    def calculate_visibility_duration(
        user_attributes: Optional[dict] = None
    ) -> int:
        """
        Calculate visibility duration based on configuration and user attributes.
        
        During promo mode: Returns configured promotional days.
        After promo: Returns 0 (payment required).
        
        Future: Can add user-specific bonuses (new users, referrals, etc.)
        
        Args:
            user_attributes: Optional dict with user info for targeted promos
            
        Returns:
            Number of days to grant visibility
        """
        if not settings.REQUIRE_PAYMENT_FOR_VISIBILITY:
            # Promo mode: grant configured duration
            base_days = settings.PROMOTIONAL_LISTING_DAYS
            
            # Future: Add user-specific bonuses here
            # if user_attributes and user_attributes.get("is_new_user"):
            #     base_days += 30  # Bonus for new users
            
            return base_days
        else:
            # Payment required: no free visibility
            return 0
