from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.core.database import init_db, close_db
from app.core.exceptions import XposureException
from app.core.scheduler import init_scheduler, shutdown_scheduler
from app.core.logging_config import setup_logging
from app.middleware.logging_middleware import RequestLoggingMiddleware

setup_logging(debug=settings.DEBUG, environment=settings.ENVIRONMENT)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_scheduler()
    yield
    await close_db()
    shutdown_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for Xposure GH billboard marketplace",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Add request logging middleware (MUST be added before other middleware)
app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "X-Content-Range"],
)

# Trusted Host Middleware (production) - only enable when using domain
# Disable for IP-based access during development/testing
if not settings.DEBUG and settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=["*.xposuregh.com", "xposuregh.com"]
    )


@app.exception_handler(XposureException)
async def xposure_exception_handler(request, exc: XposureException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "data": None, "message": exc.detail, "errors": None},
        headers=exc.headers,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "data": None,
                "message": str(exc),
                "errors": [{"type": type(exc).__name__, "detail": str(exc)}],
            },
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "data": None,
                "message": "Internal server error",
                "errors": None,
            },
        )


@app.get("/health")
async def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        },
        "message": "Service is running",
    }


@app.get("/")
async def root():
    return {
        "success": True,
        "data": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "docs": (
                "/docs" if settings.DEBUG else "Documentation disabled in production"
            ),
            "health": "/health",
        },
        "message": "Welcome to Xposure GH API",
    }


from app.api.v1.router import api_router

app.include_router(api_router, prefix=settings.API_PREFIX)
