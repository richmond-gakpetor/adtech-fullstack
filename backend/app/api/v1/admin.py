"""Admin management endpoints"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import uuid

from app.core.database import get_db
from app.core.auth import get_current_admin
from app.core.permissions import get_user_permissions, AdminPermission
from app.core.scheduler import get_scheduler_status
from app.services.visibility_service import VisibilityService
from app.models.billboard import Billboard
from app.models.user import User
from app.services.admin_service import admin_service
from app.services.user_service import UserService
from app.services.reminder_service import ReminderService
from app.schemas.admin import (
    AdminStatsResponse,
    AdminUserListResponse,
    AdminUserResponse,
    UserStatusUpdate,
    UserTypeChangeRequest,
    AdminPermissionResponse
)
from app.schemas.user import KYCReview, VerificationStatus
from app.schemas.billboard import BillboardCreate, BillboardResponse
from app.schemas.common import ResponseModel


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Get platform statistics",
    description="Get overall platform statistics including users, billboards, reviews, and revenue"
)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get platform-wide statistics (admin only)"""
    return await admin_service.get_platform_stats(db)


@router.get(
    "/users",
    response_model=AdminUserListResponse,
    summary="Get all users",
    description="Get paginated list of users with optional filters"
)
async def get_users(
    user_type: Optional[str] = Query(None, description="Filter by user type (owner, advertiser, admin)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    is_verified: Optional[bool] = Query(None, description="Filter by verified status"),
    search: Optional[str] = Query(None, description="Search in email, first name, last name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get paginated list of users with filters (admin only)"""
    return await admin_service.get_users(
        db,
        user_type=user_type,
        is_active=is_active,
        is_verified=is_verified,
        search=search,
        page=page,
        page_size=page_size
    )


@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
    summary="Get user details",
    description="Get detailed information about a specific user"
)
async def get_user_details(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Get detailed user information (admin only)"""
    return await admin_service.get_user_by_id(db, uuid.UUID(user_id))


@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserResponse,
    summary="Update user status",
    description="Update user's active and verified status"
)
async def update_user_status(
    user_id: str,
    status_update: UserStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Update user status - activate/deactivate, verify/unverify (admin only)"""
    return await admin_service.update_user_status(
        db,
        uuid.UUID(user_id),
        status_update
    )


@router.patch(
    "/users/{user_id}/type",
    response_model=AdminUserResponse,
    summary="Change user type",
    description="Change user type (owner, advertiser, admin)"
)
async def change_user_type(
    user_id: str,
    type_change: UserTypeChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Change user type (admin only)"""
    return await admin_service.change_user_type(
        db,
        uuid.UUID(user_id),
        type_change
    )


@router.delete(
    "/users/{user_id}",
    summary="Delete user",
    description="Soft delete user by deactivating account"
)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Soft delete user (admin only)"""
    return await admin_service.delete_user(db, uuid.UUID(user_id))


@router.get(
    "/permissions",
    response_model=AdminPermissionResponse,
    summary="Get current admin permissions",
    description="Get list of permissions for the current admin user"
)
async def get_admin_permissions(
    current_admin: User = Depends(get_current_admin)
):
    """Get current admin's permissions"""
    permissions = get_user_permissions(current_admin)
    return AdminPermissionResponse(
        user_id=str(current_admin.id),
        user_type=current_admin.user_type,
        permissions=[p.value for p in permissions]
    )


@router.put(
    "/users/{user_id}/kyc",
    response_model=VerificationStatus,
    summary="Review KYC submission",
    description="Approve or reject a billboard owner's KYC submission (admin only)"
)
async def review_kyc(
    user_id: str,
    review: KYCReview,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Review KYC submission (admin only)"""
    
    # Convert action to approved boolean
    approved = review.action == "approve"
    
    # Review KYC
    updated_user = await UserService.review_kyc(
        db,
        user_id=uuid.UUID(user_id),
        approved=approved,
        admin_id=current_admin.id,
        rejection_reason=review.rejection_reason,
        notes=review.notes
    )
    
    return VerificationStatus(
        email_verified=updated_user.email_verified,
        kyc_status=updated_user.kyc_status,
        needs_email_verification=updated_user.needs_email_verification,
        needs_kyc=updated_user.needs_kyc,
        can_list_billboards=updated_user.can_list_billboards,
        kyc_under_review=updated_user.kyc_under_review
    )


@router.put(
    "/users/{user_id}/kyc/mark-submitted",
    response_model=VerificationStatus,
    summary="Admin override: mark KYC as submitted",
    description=(
        "Force a billboard owner's KYC status to 'submitted' so it appears in the "
        "review queue. Use when a user completed the external Google Form but did not "
        "return to the platform to confirm their submission (admin only)."
    )
)
async def admin_mark_kyc_submitted(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Admin override: mark KYC as submitted (admin only)"""
    updated_user = await UserService.admin_mark_kyc_submitted(
        db,
        user_id=uuid.UUID(user_id),
    )

    return VerificationStatus(
        email_verified=updated_user.email_verified,
        kyc_status=updated_user.kyc_status,
        needs_email_verification=updated_user.needs_email_verification,
        needs_kyc=updated_user.needs_kyc,
        can_list_billboards=updated_user.can_list_billboards,
        kyc_under_review=updated_user.kyc_under_review
    )


@router.post(
    "/reminders/trigger",
    response_model=ResponseModel[dict],
    summary="Manually trigger reminder check",
    description="Manually trigger the listing expiration reminder check (admin only)"
)
async def trigger_reminder_check(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Manually trigger reminder check for testing"""
    stats = await ReminderService.check_and_send_reminders()
    
    return ResponseModel(
        success=True,
        message="Reminder check completed",
        data=stats
    )


@router.post(
    "/views/trigger",
    response_model=ResponseModel[dict],
    summary="Manually trigger billboard views increment",
    description="Manually run the billboard views increment job (admin only, for testing/debugging)"
)
async def trigger_views_increment(
    current_admin: User = Depends(get_current_admin)
):
    """Manually trigger the views increment job for debugging"""
    result = await VisibilityService.increment_active_billboard_views()

    return ResponseModel(
        success=True,
        message=f"Views increment complete. Billboards updated: {result['billboards_updated']}",
        data=result
    )


@router.get(
    "/scheduler/status",
    response_model=ResponseModel[dict],
    summary="Get scheduler status",
    description="Get current status of the background scheduler (admin only)"
)
async def get_scheduler_status_endpoint(
    current_admin: User = Depends(get_current_admin)
):
    """Get scheduler status"""
    status = get_scheduler_status()
    
    return ResponseModel(
        success=True,
        message="Scheduler status retrieved",
        data=status
    )


@router.post(
    "/reminders/send/{billboard_id}",
    response_model=ResponseModel[dict],
    summary="Send manual reminder for specific billboard",
    description="Send a manual expiration reminder for a specific billboard (admin only, for testing)"
)
async def send_manual_reminder(
    billboard_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Send manual reminder for specific billboard"""
    success = await ReminderService.send_manual_reminder(db, billboard_id)
    
    if success:
        return ResponseModel(
            success=True,
            message=f"Reminder sent for billboard {billboard_id}",
            data=None
        )
    else:
        return ResponseModel(
            success=False,
            message=f"Failed to send reminder for billboard {billboard_id}",
            data=None
        )


@router.post(
    "/billboards",
    response_model=ResponseModel[BillboardResponse],
    status_code=201,
    summary="Create billboard on behalf of owner",
    description="Admin creates a billboard listing. Use contact_name and contact_phone to show the real owner's details instead of the admin's profile."
)
async def admin_create_billboard(
    billboard_data: BillboardCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin)
):
    """Create a billboard on behalf of an owner (admin only).
    
    The billboard is owned by the admin account but contact_name and contact_phone
    override what is displayed to advertisers on the billboard detail page.
    """
    billboard_dict = billboard_data.model_dump()
    billboard = Billboard(
        owner_id=current_admin.id,
        is_active=True,
        **billboard_dict
    )
    db.add(billboard)
    await db.commit()
    await db.refresh(billboard)

    return ResponseModel(
        success=True,
        data=BillboardResponse.model_validate(billboard),
        message="Billboard created successfully"
    )

