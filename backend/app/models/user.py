from sqlalchemy import Column, String, Boolean, Enum as SQLEnum, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import ENUM, UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Optional
import enum
import uuid
from app.models.base import Base


class UserType(str, enum.Enum):
    OWNER = "owner"
    ADVERTISER = "advertiser"
    ADMIN = "admin"


class KYCStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"


class User(Base):
    """User model for all user types (owner, advertiser, admin)"""
    
    __tablename__ = "users"
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # User Type
    user_type = Column(ENUM('owner', 'advertiser', 'admin', name='user_type', create_type=False), nullable=False, index=True)
    
    # Profile Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    
    # Account Status
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Email Verification
    email_verified = Column(Boolean, default=False, nullable=False, index=True)
    email_verification_token = Column(String(255), nullable=True, unique=True)
    email_verification_token_expires = Column(DateTime, nullable=True)
    email_verified_at = Column(DateTime, nullable=True)
    
    # KYC Verification (for billboard owners)
    kyc_status = Column(
        ENUM('pending', 'submitted', 'approved', 'rejected', name='kyc_status', create_type=True),
        default='pending',
        nullable=False,
        index=True
    )
    kyc_submission_count = Column(Integer, default=0, nullable=False)
    kyc_submitted_at = Column(DateTime, nullable=True)
    kyc_reviewed_at = Column(DateTime, nullable=True)
    kyc_reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    kyc_rejection_reason = Column(Text, nullable=True)
    
    # Password Reset
    password_reset_token = Column(String(255), nullable=True, unique=True)
    password_reset_token_expires = Column(DateTime, nullable=True)
    
    # Relationships
    billboards = relationship("Billboard", back_populates="owner", cascade="all, delete-orphan")
    saved_billboards = relationship("SavedBillboard", back_populates="user", cascade="all, delete-orphan")
    kyc_reviewed_by = relationship("User", foreign_keys=[kyc_reviewed_by_id], remote_side="User.id")
    # reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    # reviews_received = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")
    
    @property
    def full_name(self) -> str:
        """Get full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def can_list_billboards(self) -> bool:
        """Check if user can create billboard listings"""
        if self.user_type != UserType.OWNER.value:
            return False
        return self.email_verified and self.kyc_status == KYCStatus.APPROVED.value
    
    @property
    def needs_email_verification(self) -> bool:
        """Check if email verification is pending"""
        return not self.email_verified
    
    @property
    def needs_kyc(self) -> bool:
        """Check if KYC is required and pending"""
        if self.user_type != UserType.OWNER.value:
            return False
        return self.kyc_status in [KYCStatus.PENDING.value, KYCStatus.REJECTED.value]
    
    @property
    def kyc_under_review(self) -> bool:
        """Check if KYC is currently under review"""
        return self.kyc_status == KYCStatus.SUBMITTED.value
    
    def __repr__(self) -> str:
        return f"<User {self.email} ({self.user_type})>"
