"""Reminder service for billboard listing expirations"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.config import settings
from app.models.payment import BillboardListingPayment
from app.models.billboard import Billboard
from app.models.user import User
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


class ReminderService:
    """Service for handling billboard listing expiration reminders"""
    
    @staticmethod
    async def check_and_send_reminders() -> Dict[str, int]:
        """
        Check for listings expiring soon and send reminder emails.
        Runs as a scheduled task.
        
        Returns:
            Dictionary with count of reminders sent per interval
        """
        if not settings.REMINDER_ENABLED:
            logger.info("Reminder system is disabled")
            return {}
        
        logger.info("Starting reminder check...")
        stats = {f"{interval}d": 0 for interval in settings.REMINDER_INTERVALS}
        
        try:
            async with AsyncSessionLocal() as db:
                for days_before in settings.REMINDER_INTERVALS:
                    sent_count = await ReminderService._process_reminder_interval(
                        db, days_before
                    )
                    stats[f"{days_before}d"] = sent_count
                    logger.info(f"Sent {sent_count} reminders for {days_before}-day interval")
            
            total_sent = sum(stats.values())
            logger.info(f"Reminder check complete. Total sent: {total_sent}")
            return stats
            
        except Exception as e:
            logger.error(f"Error in reminder check: {str(e)}", exc_info=True)
            return stats
    
    @staticmethod
    async def _process_reminder_interval(
        db: AsyncSession,
        days_before: int
    ) -> int:
        """
        Process reminders for a specific interval (e.g., 3 days, 1 day)
        
        Args:
            db: Database session
            days_before: Number of days before expiration
            
        Returns:
            Number of reminders sent
        """
        # Calculate the target expiration date (today + days_before)
        target_date_start = datetime.utcnow() + timedelta(days=days_before)
        target_date_end = target_date_start + timedelta(days=1)
        
        # Query for listings expiring on the target date
        listings = await ReminderService._get_expiring_listings(
            db, target_date_start, target_date_end
        )
        
        sent_count = 0
        for listing_data in listings:
            try:
                success = await EmailService.send_listing_expiration_reminder(
                    user_email=listing_data["owner_email"],
                    user_name=listing_data["owner_name"],
                    billboard_title=listing_data["billboard_title"],
                    billboard_location=listing_data["billboard_location"],
                    billboard_id=listing_data["billboard_id"],
                    expires_at=listing_data["expires_at"],
                    days_remaining=days_before
                )
                
                if success:
                    sent_count += 1
                    logger.info(
                        f"Sent {days_before}-day reminder for billboard: "
                        f"{listing_data['billboard_title']} (owner: {listing_data['owner_email']})"
                    )
                else:
                    logger.warning(
                        f"Failed to send reminder for billboard: "
                        f"{listing_data['billboard_title']}"
                    )
                    
            except Exception as e:
                logger.error(
                    f"Error sending reminder for billboard {listing_data.get('billboard_title')}: {str(e)}"
                )
                continue
        
        return sent_count
    
    @staticmethod
    async def _get_expiring_listings(
        db: AsyncSession,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """
        Get listings expiring within the specified date range
        
        Args:
            db: Database session
            start_date: Start of date range
            end_date: End of date range
            
        Returns:
            List of dictionaries with listing and owner information
        """
        # Query for active listings expiring in the target range
        stmt = (
            select(
                BillboardListingPayment.billboard_id,
                BillboardListingPayment.access_expires_at,
                Billboard.title,
                Billboard.location,
                Billboard.owner_id,
                User.email,
                User.first_name
            )
            .join(Billboard, BillboardListingPayment.billboard_id == Billboard.id)
            .join(User, Billboard.owner_id == User.id)
            .where(
                and_(
                    BillboardListingPayment.is_active == True,
                    BillboardListingPayment.access_expires_at >= start_date,
                    BillboardListingPayment.access_expires_at < end_date,
                    Billboard.is_active == True
                )
            )
        )
        
        result = await db.execute(stmt)
        rows = result.all()
        
        listings = []
        for row in rows:
            listings.append({
                "billboard_id": row.billboard_id,
                "expires_at": row.access_expires_at,
                "billboard_title": row.title,
                "billboard_location": row.location,
                "owner_id": row.owner_id,
                "owner_email": row.email,
                "owner_name": row.first_name
            })
        
        return listings
    
    @staticmethod
    async def send_manual_reminder(
        db: AsyncSession,
        billboard_id: str
    ) -> bool:
        """
        Manually trigger a reminder for a specific billboard (useful for testing)
        
        Args:
            db: Database session
            billboard_id: Billboard ID
            
        Returns:
            True if reminder sent successfully
        """
        try:
            # Get listing payment details
            stmt = (
                select(
                    BillboardListingPayment.billboard_id,
                    BillboardListingPayment.access_expires_at,
                    Billboard.title,
                    Billboard.location,
                    Billboard.owner_id,
                    User.email,
                    User.first_name
                )
                .join(Billboard, BillboardListingPayment.billboard_id == Billboard.id)
                .join(User, Billboard.owner_id == User.id)
                .where(BillboardListingPayment.billboard_id == billboard_id)
            )
            
            result = await db.execute(stmt)
            row = result.first()
            
            if not row:
                logger.warning(f"No listing found for billboard: {billboard_id}")
                return False
            
            # Calculate days remaining
            days_remaining = (row.access_expires_at - datetime.utcnow()).days
            
            # Send reminder
            success = await EmailService.send_listing_expiration_reminder(
                user_email=row.email,
                user_name=row.first_name,
                billboard_title=row.title,
                billboard_location=row.location,
                billboard_id=row.billboard_id,
                expires_at=row.access_expires_at,
                days_remaining=max(1, days_remaining)  # Minimum 1 day
            )
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending manual reminder: {str(e)}", exc_info=True)
            return False
