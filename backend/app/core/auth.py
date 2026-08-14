from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.models.user import User, UserType


# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials containing JWT token
        db: Database session
        
    Returns:
        Current authenticated user
        
    Raises:
        UnauthorizedException: If token is invalid or user not found
    """
    token = credentials.credentials
    
    # Verify and decode token
    payload = verify_access_token(token)
    user_id: str = payload.get("sub")
    
    if not user_id:
        raise UnauthorizedException(detail="Invalid token payload")
    
    # Fetch user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise UnauthorizedException(detail="User not found")
    
    if not user.is_active:
        raise UnauthorizedException(detail="User account is inactive")
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is active.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current active user
        
    Raises:
        UnauthorizedException: If user is not active
    """
    if not current_user.is_active:
        raise UnauthorizedException(detail="User account is inactive")
    
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure user is verified.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Current verified user
        
    Raises:
        ForbiddenException: If user is not verified
    """
    if not current_user.is_verified:
        raise ForbiddenException(detail="User account is not verified")
    
    return current_user


# ============= User Type Dependencies =============

def require_user_type(*allowed_types: UserType):
    """
    Dependency factory to require specific user types.
    
    Args:
        *allowed_types: Variable number of allowed user types
        
    Returns:
        Dependency function that checks user type
        
    Example:
        @router.get("/", dependencies=[Depends(require_user_type(UserType.OWNER))])
        async def owner_only_endpoint():
            ...
    """
    async def check_user_type(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.user_type not in allowed_types:
            raise ForbiddenException(
                detail=f"This endpoint requires one of: {', '.join(t.value for t in allowed_types)}"
            )
        return current_user
    
    return check_user_type


async def get_current_owner(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to get current user and ensure they are an owner"""
    if current_user.user_type != UserType.OWNER:
        raise ForbiddenException(detail="Only billboard owners can access this resource")
    return current_user


async def get_current_advertiser(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to get current user and ensure they are an advertiser"""
    if current_user.user_type != UserType.ADVERTISER:
        raise ForbiddenException(detail="Only advertisers can access this resource")
    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to get current user and ensure they are an admin"""
    if current_user.user_type != UserType.ADMIN:
        raise ForbiddenException(detail="Only admins can access this resource")
    return current_user


# ============= Optional Authentication =============

async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get the current user.
    Returns None if no token is provided or token is invalid.
    
    Useful for endpoints that work for both authenticated and anonymous users.
    
    Args:
        credentials: Optional HTTP Bearer credentials
        db: Database session
        
    Returns:
        Current user or None
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_access_token(token)
        user_id: str = payload.get("sub")
        
        if not user_id:
            return None
        
        result = await db.execute(
            select(User).where(User.id == user_id, User.is_active == True)
        )
        user = result.scalar_one_or_none()
        return user
    except Exception:
        return None
