from typing import Any, Optional, Dict
from fastapi import HTTPException, status


class XposureException(HTTPException):
    """Base exception class for Xposure GH"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        headers: Optional[Dict[str, str]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class NotFoundException(XposureException):
    """Resource not found exception"""
    
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class BadRequestException(XposureException):
    """Bad request exception"""
    
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class UnauthorizedException(XposureException):
    """Unauthorized exception"""
    
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )


class ForbiddenException(XposureException):
    """Forbidden exception"""
    
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictException(XposureException):
    """Conflict exception (duplicate resource)"""
    
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class ValidationException(XposureException):
    """Validation exception"""
    
    def __init__(self, detail: str = "Validation error"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class PaymentException(XposureException):
    """Payment processing exception"""
    
    def __init__(self, detail: str = "Payment processing failed"):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)


class ServiceUnavailableException(XposureException):
    """Service unavailable exception"""
    
    def __init__(self, detail: str = "Service temporarily unavailable"):
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)
