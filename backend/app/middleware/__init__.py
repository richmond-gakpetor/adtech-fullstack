"""
Middleware package for Xposure GH API
"""
from app.middleware.logging_middleware import RequestLoggingMiddleware

__all__ = ["RequestLoggingMiddleware"]
