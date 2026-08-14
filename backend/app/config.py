from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    
    APP_NAME: str = "Xposure GH API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    API_PREFIX: str = "/api/v1"
    
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v
    
    DATABASE_URL: str
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 600
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 1
    EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS: int = 24
    
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "eu-west-1"
    S3_BUCKET_NAME: str
    CLOUDFRONT_DOMAIN: str
    
    PAYSTACK_SECRET_KEY: str
    PAYSTACK_PUBLIC_KEY: str
    PAYSTACK_WEBHOOK_SECRET: str
    
    RESEND_API_KEY: str
    FROM_EMAIL: str = "noreply@info.xposuregh.com"
    FROM_NAME: str = "Xposure GH"
    
    RATE_LIMIT_PER_MINUTE: int = 60
    
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    
    @field_validator("ALLOWED_IMAGE_EXTENSIONS", mode="before")
    @classmethod
    def parse_extensions(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [ext.strip() for ext in v.split(",")]
        return v
    
    # Frontend URLs
    FRONTEND_URL: str = "http://localhost:3000"
    PASSWORD_RESET_URL: str = "http://localhost:3000/reset-password"
    EMAIL_VERIFICATION_URL: str = "http://localhost:3000/verify-email"
    
    # KYC Configuration
    KYC_GOOGLE_FORM_URL: str = "https://forms.gle/your-form-id-here"
    KYC_REVIEW_TURNAROUND_DAYS: int = 3
    
    # Billboard Listing Configuration
    REQUIRE_PAYMENT_FOR_VISIBILITY: bool = False
    PROMOTIONAL_LISTING_DAYS: int = 60
    LISTING_GRACE_DAYS: int = 3
    
    # Billboard Listing Reminder Configuration
    REMINDER_ENABLED: bool = True
    REMINDER_INTERVALS: List[int] = [3, 1]
    REMINDER_CHECK_TIME: str = "10:00"
    
    @field_validator("REMINDER_INTERVALS", mode="before")
    @classmethod
    def parse_reminder_intervals(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [int(x.strip()) for x in v.split(",")]
        return v
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
