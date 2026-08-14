from fastapi import APIRouter
from app.api.v1 import auth, users, billboards, uploads, payments, reviews, admin, config

api_router = APIRouter()

api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)

api_router.include_router(
    billboards.router,
    prefix="/billboards",
    tags=["Billboards"]
)

api_router.include_router(
    uploads.router,
    prefix="/uploads",
    tags=["File Uploads"]
)

api_router.include_router(
    payments.router,
    prefix="/payments",
    tags=["Payments"]
)

api_router.include_router(
    reviews.router,
    prefix="/reviews",
    tags=["Reviews"]
)

api_router.include_router(
    admin.router,
    tags=["Admin"]
)

api_router.include_router(
    config.router,
    prefix="/config",
    tags=["Configuration"]
)
