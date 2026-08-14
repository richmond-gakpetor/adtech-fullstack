from enum import Enum
from typing import List
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserType
from app.core.auth import get_current_user
from app.core.exceptions import ForbiddenException


class AdminPermission(str, Enum):
    """Admin permission types (for future extensibility)"""
    
    # User management
    MANAGE_USERS = "manage_users"
    VIEW_USERS = "view_users"
    
    # Billboard management
    MANAGE_BILLBOARDS = "manage_billboards"
    APPROVE_BILLBOARDS = "approve_billboards"
    
    # Review management
    MANAGE_REVIEWS = "manage_reviews"
    VERIFY_REVIEWS = "verify_reviews"
    
    # Support management
    MANAGE_SUPPORT = "manage_support"
    ASSIGN_TICKETS = "assign_tickets"
    
    # Payment management
    VIEW_PAYMENTS = "view_payments"
    MANAGE_PAYMENTS = "manage_payments"
    
    # Platform management
    VIEW_ANALYTICS = "view_analytics"
    MANAGE_SETTINGS = "manage_settings"


ADMIN_PERMISSIONS: List[AdminPermission] = [
    AdminPermission.MANAGE_USERS,
    AdminPermission.VIEW_USERS,
    AdminPermission.MANAGE_BILLBOARDS,
    AdminPermission.APPROVE_BILLBOARDS,
    AdminPermission.MANAGE_REVIEWS,
    AdminPermission.VERIFY_REVIEWS,
    AdminPermission.MANAGE_SUPPORT,
    AdminPermission.ASSIGN_TICKETS,
    AdminPermission.VIEW_PAYMENTS,
    AdminPermission.MANAGE_PAYMENTS,
    AdminPermission.VIEW_ANALYTICS,
    AdminPermission.MANAGE_SETTINGS,
]


def has_permission(user: User, permission: AdminPermission) -> bool:
    """
    Check if user has a specific permission
    
    Args:
        user: User to check
        permission: Permission to check for
        
    Returns:
        True if user has permission
    """
    # Simple check: All admins have all permissions
    return user.user_type == UserType.ADMIN


def require_permission(permission: AdminPermission):
    """
    Dependency factory to require a specific admin permission
    
    Args:
        permission: Required permission
        
    Returns:
        Dependency function that checks permission
        
    Example:
        @router.delete("/{id}", dependencies=[Depends(require_permission(AdminPermission.MANAGE_USERS))])
        async def delete_user(id: str):
            ...
    """
    async def check_permission(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if not has_permission(current_user, permission):
            raise ForbiddenException(
                detail=f"You do not have permission: {permission.value}"
            )
        return current_user
    
    return check_permission


def require_admin():
    """
    Simple dependency to require admin access
    Alias for get_current_admin for consistency
    
    Returns:
        Dependency function that checks if user is admin
        
    Example:
        @router.get("/admin/dashboard", dependencies=[Depends(require_admin())])
        async def admin_dashboard():
            ...
    """
    async def check_admin(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.user_type != UserType.ADMIN:
            raise ForbiddenException(detail="Admin access required")
        return current_user
    
    return check_admin


def get_user_permissions(user: User) -> List[AdminPermission]:
    """
    Get all permissions for a user
    
    Args:
        user: User to get permissions for
        
    Returns:
        List of permissions
    """
    if user.user_type == UserType.ADMIN:
        return ADMIN_PERMISSIONS
    return []
