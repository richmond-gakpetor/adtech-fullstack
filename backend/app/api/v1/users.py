"""User profile endpoints"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_user
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    PasswordChange,
    UserPublicProfile,
    VerificationStatus,
    KYCSubmission
)
from app.schemas.common import ResponseModel
from app.services.user_service import UserService
from app.models.user import User
from uuid import UUID


router = APIRouter()


@router.get(
    "/me",
    response_model=ResponseModel[UserResponse],
    summary="Get current user profile",
    description="Get authenticated user's full profile"
)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile"""
    
    return ResponseModel(
        success=True,
        data=UserResponse.model_validate(current_user),
        message="Profile retrieved successfully"
    )


@router.patch(
    "/me",
    response_model=ResponseModel[UserResponse],
    summary="Update current user profile",
    description="Update authenticated user's profile information"
)
async def update_my_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile"""
    
    updated_user = await UserService.update_user(db, current_user, user_data)
    
    return ResponseModel(
        success=True,
        data=UserResponse.model_validate(updated_user),
        message="Profile updated successfully"
    )


@router.post(
    "/me/change-password",
    response_model=ResponseModel[dict],
    summary="Change password",
    description="Change current user's password"
)
async def change_my_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change current user's password"""
    
    await UserService.change_password(db, current_user, password_data)
    
    return ResponseModel(
        success=True,
        data={"message": "Password changed successfully"},
        message="Password changed"
    )


@router.get(
    "/{user_id}/profile",
    response_model=ResponseModel[UserPublicProfile],
    summary="Get public user profile",
    description="Get public profile of any user (limited data)"
)
async def get_user_public_profile(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get public profile of a user"""
    
    user = await UserService.get_user_by_id(db, user_id)
    
    return ResponseModel(
        success=True,
        data=UserPublicProfile.model_validate(user),
        message="User profile retrieved successfully"
    )


@router.get(
    "/me/verification-status",
    response_model=ResponseModel[VerificationStatus],
    summary="Get verification status",
    description="Get current user's email and KYC verification status"
)
async def get_verification_status(
    current_user: User = Depends(get_current_user)
):
    """Get current user's verification status"""
    
    return ResponseModel(
        success=True,
        data=VerificationStatus(
            email_verified=current_user.email_verified,
            kyc_status=current_user.kyc_status,
            needs_email_verification=current_user.needs_email_verification,
            needs_kyc=current_user.needs_kyc,
            can_list_billboards=current_user.can_list_billboards,
            kyc_under_review=current_user.kyc_under_review
        ),
        message="Verification status retrieved"
    )


@router.get(
    "/me/kyc-form-url",
    response_model=ResponseModel[dict],
    summary="Get KYC form URL",
    description="Get prefilled Google Form URL for KYC submission (billboard owners only)"
)
async def get_kyc_form_url(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get KYC form URL for current user"""
    
    form_url = await UserService.get_kyc_form_url(db)
    
    return ResponseModel(
        success=True,
        data={"form_url": form_url},
        message="KYC form URL generated"
    )


@router.post(
    "/me/submit-kyc",
    response_model=ResponseModel[VerificationStatus],
    summary="Confirm KYC submission",
    description="Confirm that you've submitted the KYC Google Form (billboard owners only)"
)
async def submit_kyc(
    submission: KYCSubmission,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Confirm KYC form submission"""
    
    await UserService.submit_kyc(db, current_user.id, submission.notes)
    
    # Refetch user to get updated status
    await db.refresh(current_user)
    
    return ResponseModel(
        success=True,
        data=VerificationStatus(
            email_verified=current_user.email_verified,
            kyc_status=current_user.kyc_status,
            needs_email_verification=current_user.needs_email_verification,
            needs_kyc=current_user.needs_kyc,
            can_list_billboards=current_user.can_list_billboards,
            kyc_under_review=current_user.kyc_under_review
        ),
        message="KYC submission confirmed. Your documents are under review."
    )
