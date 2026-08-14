"""Authentication endpoints"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    create_password_reset_token,
    verify_password_reset_token,
)
from app.core.exceptions import BadRequestException
from app.schemas.user import (
    UserCreate,
    UserLogin,
    AuthResponse,
    UserResponse,
    Token,
    RefreshTokenRequest,
    PasswordResetRequest,
    PasswordReset,
    EmailVerificationRequest,
)
from app.schemas.common import ResponseModel
from app.services.user_service import UserService
from app.services.email_service import EmailService
from app.models.user import User


router = APIRouter()


@router.post(
    "/register",
    response_model=ResponseModel[AuthResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account (owner or advertiser)",
)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user account"""

    # Create user
    user = await UserService.create_user(db, user_data)

    # Generate email verification token and persist it before sending
    token = await UserService.generate_email_verification_token(db, user.id)
    await db.commit()

    # Send verification email
    await EmailService.send_email_verification(
        user_email=user.email,
        user_name=user.first_name,
        user_type=user.user_type,
        verification_token=token,
    )

    # Generate tokens
    token_data = {"sub": str(user.id), "email": user.email, "user_type": user.user_type}

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return ResponseModel(
        success=True,
        data=AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=Token(access_token=access_token, refresh_token=refresh_token),
        ),
        message="User registered successfully. Please check your email to verify your account.",
    )


@router.post(
    "/login",
    response_model=ResponseModel[AuthResponse],
    summary="User login",
    description="Authenticate user with email and password",
)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return tokens"""

    # Authenticate user
    user = await UserService.authenticate_user(
        db, credentials.email, credentials.password
    )

    # Generate tokens
    token_data = {"sub": str(user.id), "email": user.email, "user_type": user.user_type}

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return ResponseModel(
        success=True,
        data=AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=Token(access_token=access_token, refresh_token=refresh_token),
        ),
        message="Login successful",
    )


@router.post(
    "/refresh",
    response_model=ResponseModel[Token],
    summary="Refresh access token",
    description="Get new access token using refresh token",
)
async def refresh_access_token(
    token_request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token"""

    # Verify refresh token
    payload = verify_refresh_token(token_request.refresh_token)
    user_id = payload.get("sub")

    # Verify user still exists and is active
    user = await UserService.get_user_by_id(db, user_id)

    if not user.is_active:
        raise BadRequestException(detail="User account is inactive")

    # Generate new tokens
    token_data = {"sub": str(user.id), "email": user.email, "user_type": user.user_type}

    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return ResponseModel(
        success=True,
        data=Token(access_token=access_token, refresh_token=refresh_token),
        message="Token refreshed successfully",
    )


@router.post(
    "/forgot-password",
    response_model=ResponseModel[dict],
    summary="Request password reset",
    description="Send password reset link to user email",
)
async def forgot_password(
    request: PasswordResetRequest, db: AsyncSession = Depends(get_db)
):
    """Request password reset token"""

    # Check if user exists
    user = await UserService.get_user_by_email(db, request.email)

    if user:
        # Generate password reset token
        reset_token = create_password_reset_token(user.email)

        # Send password reset email
        await EmailService.send_password_reset_email(
            user_email=user.email,
            user_name=user.first_name or "User",
            reset_token=reset_token,
        )

    # Always return success to prevent email enumeration
    return ResponseModel(
        success=True,
        data={"message": "If the email exists, a password reset link has been sent"},
        message="Password reset email sent",
    )


@router.post(
    "/reset-password",
    response_model=ResponseModel[dict],
    summary="Reset password",
    description="Reset password using token from email",
)
async def reset_password(reset_data: PasswordReset, db: AsyncSession = Depends(get_db)):
    """Reset password using token"""

    # Verify token and get email
    email = verify_password_reset_token(reset_data.token)

    # Reset password
    await UserService.reset_password(db, email, reset_data.new_password)

    return ResponseModel(
        success=True,
        data={"message": "Password has been reset successfully"},
        message="Password reset successful",
    )


@router.post(
    "/verify-email",
    response_model=ResponseModel[dict],
    summary="Verify email with token",
    description="Verify user's email address using the token sent to their email",
)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """Verify user's email with verification token"""

    await UserService.verify_email(db, token)

    return ResponseModel(
        success=True,
        data={"message": "Email verified successfully. You can now log in."},
        message="Email verification successful",
    )


@router.post(
    "/resend-verification",
    response_model=ResponseModel[dict],
    summary="Resend verification email",
    description="Resend email verification link to user",
)
async def resend_verification(
    request: EmailVerificationRequest, db: AsyncSession = Depends(get_db)
):
    """Resend verification email to user"""

    await UserService.resend_verification_email(db, request.email)

    return ResponseModel(
        success=True,
        data={"message": "Verification email sent. Please check your inbox."},
        message="Verification email sent",
    )
