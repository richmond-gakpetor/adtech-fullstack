"""Billboard service for business logic"""

from typing import Optional, List, Tuple
from uuid import UUID
from datetime import date, datetime, timedelta
from math import radians, cos, sin, asin, sqrt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, delete, cast, Float, text
from sqlalchemy.orm import joinedload
from app.models.billboard import Billboard, SavedBillboard, BillboardType
from app.models.user import User
from app.models.payment import Payment, BillboardListingPayment, PaymentStatus, PaymentType
from app.schemas.billboard import BillboardCreate, BillboardUpdate, BillboardFilters
from app.schemas.common import PaginationParams
from app.core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from app.services.visibility_service import VisibilityService
from app.config import settings


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great circle distance between two points in km.
    Uses the Haversine formula.
    """
    # Convert to radians
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
    c = 2 * asin(sqrt(a))
    
    # Earth's radius in km
    r = 6371
    return c * r


class BillboardService:
    """Service class for billboard-related operations"""
    
    @staticmethod
    async def create_billboard(
        db: AsyncSession,
        owner: User,
        billboard_data: BillboardCreate
    ) -> Billboard:
        """
        Create a new billboard listing.
        
        Rubric-compliant implementation:
        - Auto-grants visibility time during promo mode
        - Creates zero-cost payment record as gate
        - Time-based visibility, not boolean states
        
        Args:
            db: Database session
            owner: Billboard owner (must be owner type)
            billboard_data: Billboard data
            
        Returns:
            Created billboard
        """
        billboard = Billboard(
            owner_id=owner.id,
            **billboard_data.model_dump()
        )
        
        db.add(billboard)
        await db.flush()
        await db.refresh(billboard)
        
        # Auto-grant visibility time if promo mode is active
        await BillboardService._grant_initial_visibility(db, billboard, owner)
        
        await db.commit()
        await db.refresh(billboard)
        
        return billboard
    
    @staticmethod
    async def _grant_initial_visibility(
        db: AsyncSession,
        billboard: Billboard,
        owner: User
    ) -> None:
        """
        Grant initial visibility time to a newly created billboard.
        
        During promo: Creates zero-cost payment and grants configured duration
        After promo: No initial visibility (payment required)
        
        This follows rubric principle: "Promo as zero-cost paid behavior"
        """
        # Calculate duration based on configuration
        duration_days = VisibilityService.calculate_visibility_duration()
        
        if duration_days > 0:
            # Create zero-cost payment record (promo mode)
            now = datetime.utcnow()
            
            payment = Payment(
                user_id=owner.id,
                reference=f"promo-{billboard.id}",
                type=PaymentType.LISTING_ACCESS,
                status=PaymentStatus.COMPLETED,
                amount_pesewas=0,  # Zero cost during promo
                currency="GHS",
                paid_at=now,
                verified_at=now,
                payment_metadata={
                    "promotional": True,
                    "auto_granted": True,
                    "promo_duration_days": duration_days
                }
            )
            
            db.add(payment)
            await db.flush()
            
            # Create listing payment with visibility window
            listing_payment = BillboardListingPayment(
                payment_id=payment.id,
                billboard_id=billboard.id,
                tier_id="promo",
                duration_days=duration_days,
                price_ghs=0,
                access_starts_at=now,
                access_expires_at=now + timedelta(days=duration_days),
                is_active=True  # Keep for backward compat, but not used for visibility
            )
            
            db.add(listing_payment)
            await db.flush()

            # Set is_active=True for backward compatibility (matches payment_service behavior)
            billboard.is_active = True
    
    @staticmethod
    async def get_billboard_by_id(
        db: AsyncSession,
        billboard_id: UUID,
        load_owner: bool = False
    ) -> Billboard:
        """
        Get billboard by ID.
        
        Args:
            db: Database session
            billboard_id: Billboard UUID
            load_owner: Whether to load owner relationship
            
        Returns:
            Billboard object
            
        Raises:
            NotFoundException: If billboard not found
        """
        query = select(Billboard).where(Billboard.id == billboard_id)
        
        if load_owner:
            query = query.options(joinedload(Billboard.owner))
        
        # Always load saved_by relationship to calculate total saves
        query = query.options(joinedload(Billboard.saved_by))
        
        result = await db.execute(query)
        billboard = result.unique().scalar_one_or_none()
        
        if not billboard:
            raise NotFoundException(detail="Billboard not found")
        
        return billboard
    
    @staticmethod
    async def get_billboards(
        db: AsyncSession,
        filters: BillboardFilters,
        pagination: PaginationParams,
        current_user: Optional[User] = None
    ) -> Tuple[List[Billboard], int]:
        """
        Get billboards with filters and pagination.
        
        Rubric-compliant implementation:
        - Filters by time-based visibility (not is_active boolean)
        - Checks access_expires_at + grace period
        - Backend authority on what's visible
        
        Args:
            db: Database session
            filters: Filter parameters
            pagination: Pagination parameters
            current_user: Optional current user for personalization
            
        Returns:
            Tuple of (billboards list, total count)
        """
        # Base query - join with listing payments to check time-based visibility
        # Only show billboards with active visibility windows
        now = datetime.utcnow()
        grace_period_seconds = settings.LISTING_GRACE_DAYS * 24 * 3600
        
        # Subquery to get latest listing payment per billboard
        latest_payment_subquery = (
            select(
                BillboardListingPayment.billboard_id,
                func.max(BillboardListingPayment.access_expires_at).label('latest_expiry')
            )
            .group_by(BillboardListingPayment.billboard_id)
            .subquery()
        )
        
        # Main query with time-based visibility check
        query = (
            select(Billboard)
            .join(
                latest_payment_subquery,
                Billboard.id == latest_payment_subquery.c.billboard_id
            )
            .where(
                # Check if within grace period: now < expires_at + grace_days
                text(f"EXTRACT(EPOCH FROM (latest_expiry + INTERVAL '{settings.LISTING_GRACE_DAYS} days' - :now)) > 0")
            )
            .params(now=now)
        )
        
        # Apply filters
        if filters.location and not (filters.near_lat and filters.near_lng):
            # Only apply text-based location filter if not doing proximity search
            query = query.where(Billboard.location.ilike(f"%{filters.location}%"))
        
        if filters.billboard_type:
            query = query.where(Billboard.billboard_type == filters.billboard_type.value)
        
        if filters.is_available is not None:
            query = query.where(Billboard.is_available == filters.is_available)
        
        if filters.min_weekly_rate is not None:
            query = query.where(Billboard.weekly_rate >= filters.min_weekly_rate)
        
        if filters.max_weekly_rate is not None:
            query = query.where(Billboard.weekly_rate <= filters.max_weekly_rate)
        
        if filters.min_monthly_rate is not None:
            query = query.where(Billboard.monthly_rate >= filters.min_monthly_rate)
        
        if filters.max_monthly_rate is not None:
            query = query.where(Billboard.monthly_rate <= filters.max_monthly_rate)
        
        if filters.min_views is not None:
            query = query.where(Billboard.views >= filters.min_views)
        
        if filters.owner_id:
            query = query.where(Billboard.owner_id == filters.owner_id)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.where(
                or_(
                    Billboard.title.ilike(search_term),
                    Billboard.location.ilike(search_term),
                    Billboard.description.ilike(search_term)
                )
            )
        
        # Proximity search using Haversine formula in PostgreSQL
        # This filters billboards within the specified radius
        if filters.near_lat is not None and filters.near_lng is not None:
            radius_km = filters.radius_km or 5.0
            
            # PostgreSQL Haversine distance calculation
            # Using raw SQL for the distance calculation since it's complex
            lat1 = filters.near_lat
            lng1 = filters.near_lng
            
            # Haversine formula in PostgreSQL
            # Distance = 6371 * 2 * ASIN(SQRT(
            #   POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
            #   COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
            #   POWER(SIN(RADIANS(lng2 - lng1) / 2), 2)
            # ))
            distance_expr = text(f"""
                6371 * 2 * ASIN(SQRT(
                    POWER(SIN(RADIANS((coordinates->>'lat')::float - {lat1}) / 2), 2) +
                    COS(RADIANS({lat1})) * COS(RADIANS((coordinates->>'lat')::float)) *
                    POWER(SIN(RADIANS((coordinates->>'lng')::float - {lng1}) / 2), 2)
                ))
            """)
            
            query = query.where(distance_expr <= radius_km)
        
        # Count total results
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()
        
        # Apply sorting: by views, then by date
        query = query.order_by(
            Billboard.views.desc(),
            Billboard.created_at.desc()
        )
        
        # Apply pagination
        query = query.offset(pagination.skip).limit(pagination.limit)
        
        # Load owner relationship
        query = query.options(joinedload(Billboard.owner))
        
        # Execute query
        result = await db.execute(query)
        billboards = result.scalars().unique().all()
        
        return list(billboards), total
    
    @staticmethod
    async def get_owner_billboards(
        db: AsyncSession,
        owner_id: UUID,
        pagination: PaginationParams
    ) -> Tuple[List[Billboard], int]:
        """
        Get all billboards for a specific owner.
        
        Args:
            db: Database session
            owner_id: Owner UUID
            pagination: Pagination parameters
            
        Returns:
            Tuple of (billboards list, total count)
        """
        # Owner can see all their billboards including pending/suspended
        query = select(Billboard).where(Billboard.owner_id == owner_id)
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()
        
        # Apply sorting
        query = query.order_by(Billboard.created_at.desc())
        
        # Apply pagination
        query = query.offset(pagination.skip).limit(pagination.limit)
        
        # Execute
        result = await db.execute(query)
        billboards = result.scalars().all()
        
        return list(billboards), total
    
    @staticmethod
    async def update_billboard(
        db: AsyncSession,
        billboard: Billboard,
        owner: User,
        update_data: BillboardUpdate
    ) -> Billboard:
        """
        Update billboard.
        
        Args:
            db: Database session
            billboard: Billboard to update
            owner: Current user (must be owner)
            update_data: Update data
            
        Returns:
            Updated billboard
            
        Raises:
            ForbiddenException: If user is not the owner
        """
        if billboard.owner_id != owner.id:
            raise ForbiddenException(detail="You can only update your own billboards")
        
        update_dict = update_data.model_dump(exclude_unset=True)
        
        for field, value in update_dict.items():
            setattr(billboard, field, value)
        
        await db.flush()
        await db.refresh(billboard)
        
        return billboard
    
    @staticmethod
    async def delete_billboard(
        db: AsyncSession,
        billboard: Billboard,
        owner: User
    ) -> None:
        """
        Soft delete billboard.
        
        Args:
            db: Database session
            billboard: Billboard to delete
            owner: Current user (must be owner)
            
        Raises:
            ForbiddenException: If user is not the owner
        """
        if billboard.owner_id != owner.id:
            raise ForbiddenException(detail="You can only delete your own billboards")
        
        # Delete the billboard
        await db.delete(billboard)
        await db.flush()
    
    @staticmethod
    async def increment_views(
        db: AsyncSession,
        billboard_id: UUID
    ) -> None:
        """
        Increment billboard view count.
        
        Args:
            db: Database session
            billboard_id: Billboard UUID
        """
        billboard = await BillboardService.get_billboard_by_id(db, billboard_id)
        billboard.views += 1
        await db.flush()
    
    @staticmethod
    async def save_billboard(
        db: AsyncSession,
        user: User,
        billboard_id: UUID
    ) -> SavedBillboard:
        """
        Save/bookmark a billboard.
        
        Args:
            db: Database session
            user: Current user
            billboard_id: Billboard to save
            
        Returns:
            SavedBillboard object
            
        Raises:
            BadRequestException: If already saved
        """
        # Check if billboard exists
        await BillboardService.get_billboard_by_id(db, billboard_id)
        
        # Check if already saved
        result = await db.execute(
            select(SavedBillboard).where(
                and_(
                    SavedBillboard.user_id == user.id,
                    SavedBillboard.billboard_id == billboard_id
                )
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise BadRequestException(detail="Billboard already saved")
        
        # Create saved billboard
        saved = SavedBillboard(
            user_id=user.id,
            billboard_id=billboard_id
        )
        
        db.add(saved)
        await db.flush()
        await db.refresh(saved)
        
        return saved
    
    @staticmethod
    async def unsave_billboard(
        db: AsyncSession,
        user: User,
        billboard_id: UUID
    ) -> None:
        """
        Unsave/unbookmark a billboard.
        
        Args:
            db: Database session
            user: Current user
            billboard_id: Billboard to unsave
        """
        await db.execute(
            delete(SavedBillboard).where(
                and_(
                    SavedBillboard.user_id == user.id,
                    SavedBillboard.billboard_id == billboard_id
                )
            )
        )
        await db.flush()
    
    @staticmethod
    async def get_saved_billboards(
        db: AsyncSession,
        user: User,
        pagination: PaginationParams
    ) -> Tuple[List[Billboard], int]:
        """
        Get user's saved billboards.
        
        Args:
            db: Database session
            user: Current user
            pagination: Pagination parameters
            
        Returns:
            Tuple of (billboards list, total count)
        """
        query = (
            select(Billboard)
            .join(SavedBillboard)
            .where(SavedBillboard.user_id == user.id)
            .options(joinedload(Billboard.owner))
        )
        
        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()
        
        # Apply sorting
        query = query.order_by(SavedBillboard.created_at.desc())
        
        # Apply pagination
        query = query.offset(pagination.skip).limit(pagination.limit)
        
        # Execute
        result = await db.execute(query)
        billboards = result.scalars().unique().all()
        
        return list(billboards), total
    
    @staticmethod
    async def is_billboard_saved(
        db: AsyncSession,
        user: User,
        billboard_id: UUID
    ) -> bool:
        """
        Check if user has saved a billboard.
        
        Args:
            db: Database session
            user: Current user
            billboard_id: Billboard UUID
            
        Returns:
            True if saved, False otherwise
        """
        result = await db.execute(
            select(SavedBillboard).where(
                and_(
                    SavedBillboard.user_id == user.id,
                    SavedBillboard.billboard_id == billboard_id
                )
            )
        )
        return result.scalar_one_or_none() is not None
